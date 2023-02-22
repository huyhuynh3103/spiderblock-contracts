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
	it("Deployment should assign the total supply of tokens to the owner", async function () {
		const {hardhatToken, owner} = await loadFixture(deployTokenFixture);
		const ownerBalance = await hardhatToken.balanceOf(owner.address);
		expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
	})
	it("Should transfer tokens between accounts", async function () {
		const {hardhatToken, owner, addr1, addr2} = await loadFixture(deployTokenFixture);
		await expect(
			hardhatToken.transfer(addr1.address, 50)
		).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50,50]);
		await expect(
			hardhatToken.connect(addr1).transfer(addr2.address,50)
		).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50,50]);
	})
}
)