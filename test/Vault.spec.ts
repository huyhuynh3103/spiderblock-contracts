import { BigNumber, Contract } from 'ethers';
import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from "hardhat"
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { keccak256, parseEther } from '../helpers/ether-helper';

describe('Vault', function (){
	async function deployVaultFixture(){
		const [owner] = await ethers.getSigners();
		// deploy vault
		const vaultFactory = await ethers.getContractFactory('Vault',owner);
		const vaultContract = await vaultFactory.deploy();
		await vaultContract.deployed();
		// deploy token
		const tokenFactory = await ethers.getContractFactory('Floppy', owner);
		const tokenContract = await tokenFactory.deploy();
		await tokenContract.deployed();
		// set token
		await vaultContract.setToken(tokenContract.address);
		// get role
		const DEFAULT_ADMIN_ROLE = await vaultContract.DEFAULT_ADMIN_ROLE();
		return {
			tokenContract,
			vaultContract,
			owner,
			DEFAULT_ADMIN_ROLE,
		}
	}
	describe("Deployment", function(){
		it("Should owner has DEFAULT_ADMIN_ROLE role", async function(){
			const {owner, vaultContract, DEFAULT_ADMIN_ROLE} = await loadFixture(deployVaultFixture);
			expect(await vaultContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
		})
		it("Should owner has WITHDRAWER_ROLE role", async function(){
			const WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
			const {owner, vaultContract} = await loadFixture(deployVaultFixture);
			expect(await vaultContract.hasRole(WITHDRAWER_ROLE, owner.address)).to.be.true;
		})
	})
	describe("Transaction", function() {
		const AMOUNT_TRANSFERABLE = parseEther(1*10**6);
		const HALF_AMOUNT_TRANSFERABLE = parseEther(500*10**3);
		const DOUBLE_AMOUNT_TRANSFERABLE = parseEther(2*10**6);
		let alice: SignerWithAddress, withdrawer: SignerWithAddress, carol: SignerWithAddress;
		let token:Contract;
		let vault: Contract;
		beforeEach(async function(){
			[,alice,withdrawer,carol] = await ethers.getSigners();
			({tokenContract: token, vaultContract: vault} = await loadFixture(deployVaultFixture));
		})
		describe("withdraw()", function(){
			const AMOUNT_WITHDRAWABLE = parseEther(300*10**3); // smaller deposit amount
			beforeEach(async function(){
				await token.transfer(alice.address, AMOUNT_TRANSFERABLE);
				await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
				await vault.connect(alice).deposit(HALF_AMOUNT_TRANSFERABLE);
			})
			describe("when caller is not withdrawer", function(){
				it("then revert transaction with msg: 'Caller is not withdrawer'", async function(){
					await expect(vault.connect(withdrawer).withdraw(AMOUNT_WITHDRAWABLE, alice.address)).to.be.revertedWith("Caller is not a withdrawer");
				})
			})
			describe("when caller is withdrawer", function () {
				beforeEach(async function(){
					const WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
					await vault.grantRole(WITHDRAWER_ROLE, withdrawer.address);
				})
				describe("and disable withdrawable", function (){
					it("then revert transaction with msg: 'Withdraw is not available'", async function(){
						await vault.setWithdrawEnable(false);
						await expect(vault.connect(withdrawer).withdraw(AMOUNT_WITHDRAWABLE, alice.address)).to.be.revertedWith("Withdraw is not available");
					})
				})
				describe("and enable withdrawable", function () {
					beforeEach(async function(){
						await vault.setWithdrawEnable(true);
					})
					describe("and withdraw amount exceeds the maximum withdrawable amount", function(){
						it("then revert transaction with msg: 'Exceed maximum amount'", async function(){
							await vault.setMaxWithdrawAmount(AMOUNT_WITHDRAWABLE.div(2))
							await expect(vault.connect(withdrawer).withdraw(AMOUNT_TRANSFERABLE, alice.address)).to.be.revertedWith("Exceed maximum amount");
						})
					})
					describe("and withdraw amount is smaller than maximum amount", function(){
						beforeEach(async function () {
							await vault.setMaxWithdrawAmount(AMOUNT_TRANSFERABLE);
						})
						describe("and withdraw amount is exceeds balance", function(){
							it("then revert transaction with msg: 'ERC20: transfer amount exceeds balance'", async function (){
								const balanceOfVault:BigNumber = await token.balanceOf(vault.address);
								await expect(vault.connect(withdrawer).withdraw(balanceOfVault.add(1), alice.address)).to.be.revertedWith("ERC20: transfer amount exceeds balance");
							})
						})
						describe("and withdraw amount is valid", function () {
							it("then withdraw successfully", async function (){
								await vault.connect(withdrawer).withdraw(AMOUNT_WITHDRAWABLE, alice.address);
								expect(await token.balanceOf(vault.address)).equal(HALF_AMOUNT_TRANSFERABLE.sub(AMOUNT_WITHDRAWABLE));
								expect(await token.balanceOf(alice.address)).equal(HALF_AMOUNT_TRANSFERABLE.add(AMOUNT_WITHDRAWABLE));
							})
						})
					})
				})
			})
		})
		describe("deposit()", function(){
			beforeEach(async function(){
				await token.transfer(alice.address, AMOUNT_TRANSFERABLE);
				await token.connect(alice).approve(vault.address, token.balanceOf(alice.address));
			})
			it("Should deposit into the Vault", async function(){
				await vault.connect(alice).deposit(HALF_AMOUNT_TRANSFERABLE);
				expect(await token.balanceOf(vault.address)).equal(HALF_AMOUNT_TRANSFERABLE);
			})
			it("Should not deposit, Insufficient account balance", async function (){
				const initialBalanceOfVault = await token.balanceOf(vault.address);
				await expect(vault.connect(alice).deposit(DOUBLE_AMOUNT_TRANSFERABLE)).to.be.revertedWith("Insufficient account balance");
				expect(await token.balanceOf(vault.address)).to.equal(initialBalanceOfVault);
			})
		})
	})
})