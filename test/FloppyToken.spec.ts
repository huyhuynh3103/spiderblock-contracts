import { expect } from "chai";
import { ethers } from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";

describe("FloppyToken", async function () {
	async function deployTokenFixture(){
		const Token = await ethers.getContractFactory('Floppy');
		const [owner, addr1, addr2] = await ethers.getSigners();
		const hardhatToken = await Token.deploy();
		await hardhatToken.deployed();
		return {
			Token, owner, addr1, addr2, hardhatToken
		};
	}
	describe("Deployment", function(){
		it("Should set the right owner", async function(){
			const {hardhatToken, owner} = await loadFixture(deployTokenFixture);
			expect(await hardhatToken.owner()).to.equal(owner.address);
		})
		it("Should assign the total supply of tokens to the owner", async function () {
			const {hardhatToken, owner} = await loadFixture(deployTokenFixture);
			const ownerBalance = await hardhatToken.balanceOf(owner.address);
			expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
		})
	})
	describe("Transactions", function(){
		it("Should transfer tokens between accounts", async function () {
			const {hardhatToken, owner, addr1, addr2} = await loadFixture(deployTokenFixture);
			await expect(
				hardhatToken.transfer(addr1.address, 50)
			).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50,50]);
			await expect(
				hardhatToken.connect(addr1).transfer(addr2.address,50)
			).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50,50]);
		})
		it("Should emit Transfer event", async function() {
			const {hardhatToken, owner, addr1, addr2} = await loadFixture(deployTokenFixture);
			await expect(hardhatToken.transfer(addr1.address,50)).to.emit(
				hardhatToken, "Transfer"
			).withArgs(owner.address, addr1.address, 50);
			await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50)).to.emit(
				hardhatToken, "Transfer"
			).withArgs(addr1.address, addr2.address, 50);
		})
		it("Should fail if sender doesn't have enough tokens", async function(){
			const {hardhatToken, owner, addr1} = await loadFixture(deployTokenFixture);
			const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);
			await expect(
				hardhatToken.connect(addr1).transfer(owner.address, 1)
			).to.be.revertedWith("ERC20: transfer amount exceeds balance");
			expect(
				await hardhatToken.balanceOf(owner.address)
			).to.equal(initialOwnerBalance);
		})
	})
}
)