import { expect } from "chai";
import { ethers } from "hardhat";
console.log("FloppyToken.spec.ts: 1")

describe("FloppyToken", async function () {
	it("Deployment should assign the total supply of tokens to the owner", async function () {
		const [owner] = await ethers.getSigners();
		const FloppyToken = await ethers.getContractFactory("Floppy");
		const hardhatToken = await FloppyToken.deploy();
		const ownerBalance = await hardhatToken.balanceOf(owner.address);
		expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
	})
})