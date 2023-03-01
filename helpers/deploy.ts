import { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { BigNumberish, Contract, ContractFactory, Signer } from "ethers";
import { concat } from "ethers/lib/utils";
import { ethers, hardhatArguments, upgrades } from "hardhat";
import ConfigFile from "./config";
// Deploy directly
const deployDirect = async (
  params: any[],
  contractName: string,
  value?: BigNumberish
): Promise<Contract> => {
  console.log(`\n Deploying ... \n`);
  const contractFactory: ContractFactory = await ethers.getContractFactory(
    contractName
  );
  const contractInstance = await contractFactory.deploy(...params, { value });
  const contractTransaction = contractInstance.deployTransaction;
  console.log(`Tx submited - txHash:           ${contractTransaction.hash}`);
  await contractInstance.deployed();
  console.log(`Contract address:               ${contractInstance.address}`);
  console.log(`Contract deployment tx:         ${contractTransaction.hash}`);
  console.log(`Contract deployed from:         ${contractTransaction.from}`);
  console.log(``);
  return contractInstance;
};
// Send transaction from signer
const deploy = async (
  params: any[],
  contractName: string,
  contractSigner: Signer,
  config?:ConfigFile,
  value?: BigNumberish
): Promise<Contract> => {
  const network = hardhatArguments.network ? hardhatArguments.network : 'dev';
  console.log(`\n Deploying ${contractName} on ${network} ... \n`);
  const contractFactory: ContractFactory = await ethers.getContractFactory(
    contractName
  );
  const encodedParams = contractFactory.interface.encodeDeploy(params);
  const bytecode = contractFactory.bytecode;
  const tx =
    value === undefined
      ? {
          data: concat([bytecode, encodedParams]),
        }
      : {
          data: concat([bytecode, encodedParams]),
          value,
        };
  const deployTx = await contractSigner.sendTransaction(tx);
  console.log(`Tx submited - txHash:           ${deployTx.hash}`);
  const contractTransaction = await deployTx.wait();
  const contractInstance = await contractFactory.attach(
    contractTransaction.contractAddress
  );
  if(config){
	const configData = {
		contract: contractTransaction.contractAddress,
		params: params.map(param => {
			if(param instanceof ethers.BigNumber){
				return param.toString()
			}
			return param
		})
	}
	config.setConfig(`${network}.${contractName}`,configData);
  }
  console.log(
    `Contract address:               ${contractTransaction.contractAddress}`
  );
  console.log(
    `Contract deployment tx:         ${contractTransaction.transactionHash}`
  );
  console.log(`Contract deployed from:         ${contractTransaction.from}`);
  console.log(``);
  return contractInstance;
};

const deployProxy = async (
  params: any[],
  contractName: string,
  config?:ConfigFile,
  option: DeployProxyOptions = {kind: "uups", initializer: "initialize"}
): Promise<Contract> => {
  const network = hardhatArguments.network ? hardhatArguments.network : 'dev';
  console.log(`\n Deploying proxy ${contractName} on ${network} ... \n`);
  const factory = await ethers.getContractFactory(contractName);
  const contractProxy: Contract = await upgrades.deployProxy(factory, params, option);
  const contractTransaction = contractProxy.deployTransaction;
  console.log(`Tx submited - txHash:           ${contractTransaction.hash}`);
  await contractProxy.deployed();
  const implementAddress = await upgrades.erc1967.getImplementationAddress(
    contractProxy.address
  );
  if(config){
	const configData = {
		proxy: contractProxy.address,
		implement: implementAddress,
		params: params.map(param => {
			if(param instanceof ethers.BigNumber){
				return param.toString()
			}
			return param
		})
	}
	config.setConfig(`${network}.${contractName}`,configData);
  }
  console.log(`Proxy address:                  ${contractProxy.address}`);
  console.log(`Implementation address:         ${implementAddress}`);
  console.log(`Contract deployment tx:         ${contractTransaction.hash}`);
  console.log(`Contract deployed from:         ${contractTransaction.from}`);
  console.log(``);
  return contractProxy;
};

export { deployDirect, deploy, deployProxy };
