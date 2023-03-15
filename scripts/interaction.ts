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
		"https://bsc-dataseed4.ninicoin.io"
	);
	const storageString = await provider.getStorageAt("0xf262Dc22ca5B2f1F4Ba5FefA6453Ff1c030A99b2", 8);
	const types = ['uint64']
	console.log(`Storage ${storageString}`)
	console.log(ethers.utils.defaultAbiCoder.decode(types, storageString).toString())
	// const owner = new ethers.Wallet(privateKey, provider);
	// const crowdSaleContract = new ethers.Contract(config.bscTest.FLPCrowdsale.proxy, crowdSale.abi, owner);
	// const floppyContract = new ethers.Contract(config.bscTest.Floppy.contract, floppy.abi, owner);
	// // await floppyContract.connect(owner).transfer(crowdSaleContract.address, parseEther(5000));
	// const caller = new ethers.Wallet(callerPK, provider);
	// const tx = await crowdSaleContract.connect(caller).buyByNative({value: parseEther(0.001)})
	// await tx.wait();
}

interact().catch((error)=>{
	console.error(error);
	process.exitCode = 1
})