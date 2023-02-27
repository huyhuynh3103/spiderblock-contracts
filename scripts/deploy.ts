import { Signer } from "ethers";
import { ethers } from "hardhat";
import ConfigFile from "../helpers/config";
import constants from "../helpers/constants";
import { deploy, deployProxy } from "../helpers/deploy";
import { parseEther } from "../helpers/ether-helper";
async function main() {
	const config = new ConfigFile();
	await config.initConfig();
  	const deployer: Signer = ethers.provider.getSigner();
  	console.log(`Signer Address: ${await deployer.getAddress()}`)
  	const floppyToken = await deploy([],"Floppy", deployer, config);
	const usdtToken = await deploy([], "USDT", deployer, config);
	await deploy([
		parseEther(0.005*constants.PERCENTAGE_FRACTION),
		parseEther(0.7*constants.PERCENTAGE_FRACTION),
		usdtToken.address,
		"0x2a067B3b7254641173D50F6B811A5EA91B133066",
		floppyToken.address
	], "FLPCrowdsale", deployer, config);
	// await deploy([],"Vault",deployer,config);
	await config.updateConfig();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
