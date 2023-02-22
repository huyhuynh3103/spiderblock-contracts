import { Signer } from "ethers";
import { ethers, hardhatArguments } from "hardhat";
import ConfigFile from "../helpers/config";
import { deploy, deployProxy } from "../helpers/deploy";
async function main() {
	const config = new ConfigFile();
	await config.initConfig();
  	const deployer: Signer = ethers.provider.getSigner();
  	console.log(`Signer Address: ${await deployer.getAddress()}`)
  	await deploy([],"Floppy", deployer, config);
	await deploy([],"Vault",deployer,config);
	await config.updateConfig();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
