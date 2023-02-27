import { ethers } from 'ethers'
import config from '../config.json'
import crowdSale from '../artifacts/contracts/FLPCrowdsale.sol/FLPCrowdsale.json'
import floppy from '../artifacts/contracts/FloppyToken.sol/Floppy.json'
import usdt from '../artifacts/contracts/USDT.sol/USDT.json'
import { parseEther } from '../helpers/ether-helper'
require("dotenv").config();

const privateKey = process.env.PRIVATE_KEY || '';
const callerPK = process.env.VANITY_PRIVATE_KEY || '';

async function interact() {
	const provider = new ethers.providers.JsonRpcProvider(
		"https://data-seed-prebsc-1-s1.binance.org:8545"
	);
	const owner = new ethers.Wallet(privateKey, provider);
	const crowdSaleContract = new ethers.Contract(config.bscTest.FLPCrowdsale, crowdSale.abi, owner);
	const floppyContract = new ethers.Contract(config.bscTest.Floppy, floppy.abi, owner);
	// await floppyContract.connect(owner).transfer(crowdSaleContract.address, parseEther(5000));
	const caller = new ethers.Wallet(callerPK, provider);
	const tx = await crowdSaleContract.connect(caller).buyByNative({value: parseEther(0.001)})
	await tx.wait();
	console.log(`Tx hash ${tx.transactionHash}`)
}

interact().catch((error)=>{
	console.error(error);
	process.exitCode = 1
})