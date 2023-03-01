import { Contract, ContractFactory } from "ethers";
import { ethers, hardhatArguments, upgrades } from "hardhat";
import ConfigFile from "./config";

const upgradeProxy = async (contractName:string, proxyAddr?: string) => {
	const network = hardhatArguments.network ? hardhatArguments.network : 'dev';
    console.log(`\nUpgrade contract ${contractName} on ${network} ...\n`);
	const config = new ConfigFile();
	await config.initConfig();
	const configInit = config.getConfig()?.[network]?.[contractName];
	let proxyAddress = proxyAddr || configInit?.['proxy'] || '';
	if(!proxyAddress){
		throw new Error("Proxy address is invalid");
	}
	const factory: ContractFactory = await ethers.getContractFactory(contractName);
	const proxyInstance: Contract = await upgrades.upgradeProxy(proxyAddress, factory);
	const upgradeTx = proxyInstance.deployTransaction;
  	console.log(`Tx submited - txHash:           ${upgradeTx.hash}`);
	await proxyInstance.deployed();
  	const implementAddress = await upgrades.erc1967.getImplementationAddress(
    	proxyInstance.address
  	);
	const configData = {
		...configInit,
		implement: implementAddress,
	}
	config.setConfig(`${network}.${contractName}`,configData);
	
  	console.log(`Proxy address:                  ${proxyInstance.address}`);
  	console.log(`Implementation address:         ${implementAddress}`);
  	console.log(`Upgrade tx:                     ${upgradeTx.hash}`);
  	console.log(`Upgrade from:                   ${upgradeTx.from}`);
  	console.log(``);
	await config.updateConfig();
}

export {
	upgradeProxy
}