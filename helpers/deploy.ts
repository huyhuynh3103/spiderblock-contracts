import { BigNumberish, Contract, ContractFactory, Signer } from "ethers";
import { concat } from "ethers/lib/utils";
import { ethers, upgrades } from "hardhat";
// Deploy directly
const deployDirect = async (
  params: any[],
  contractName: string,
  value?: BigNumberish
) : Promise<Contract> => {
  console.log(`\n Deploying ... \n`)
  const contractFactory: ContractFactory = await ethers.getContractFactory(contractName)
  const contractInstance = await contractFactory.deploy(...params, {value})
  const contractTransaction = contractInstance.deployTransaction;
  console.log(`Tx submited - txHash:           ${contractTransaction.hash}`);
  await contractInstance.deployed();
  console.log(`Contract address:               ${contractInstance.address}`);
  console.log(`Contract deployment tx:         ${contractTransaction.hash}`);
  console.log(`Contract deployed from:         ${contractTransaction.from}`);
  console.log(``);
  return contractInstance;
}
// Send transaction from signer
const deploy = async (
  params: any[],
  contractName: string,
  contractSigner: Signer,
  value?: BigNumberish
) : Promise<Contract> => {
  console.log(`\n Deploying ... \n`)
  const contractFactory: ContractFactory = await ethers.getContractFactory(contractName)
  const encodedParams = contractFactory.interface.encodeDeploy(params);
  const bytecode = contractFactory.bytecode;
  const tx = value === undefined ? {
    data: concat([bytecode, encodedParams]),
  }: {
    data: concat([bytecode, encodedParams]),
    value
  }
  const deployTx = await contractSigner.sendTransaction(tx);
  console.log(`Tx submited - txHash:           ${deployTx.hash}`);
  const contractTransaction = await deployTx.wait();
  const contractInstance = await contractFactory.attach(contractTransaction.contractAddress);
  console.log(`Contract address:               ${contractTransaction.contractAddress}`);
  console.log(`Contract deployment tx:         ${contractTransaction.transactionHash}`);
  console.log(`Contract deployed from:         ${contractTransaction.from}`);
  console.log(``);
  return contractInstance;
}

const deployProxy = async (
    params: any[],
    contractName: string
) : Promise<Contract> => {
    const factory = await ethers.getContractFactory(contractName);
    const contractProxy: Contract = await upgrades.deployProxy(
        factory,
        params
    )
    const contractTransaction = contractProxy.deployTransaction;
    console.log(`Tx submited - txHash:           ${contractTransaction.hash}`);
    await contractProxy.deployed()
    const implementAddress = await upgrades.erc1967.getImplementationAddress(contractProxy.address);
    console.log(`Proxy address:                  ${contractProxy.address}`);
    console.log(`Implementation address:         ${implementAddress}`)
    console.log(`Contract deployment tx:         ${contractTransaction.hash}`);
    console.log(`Contract deployed from:         ${contractTransaction.from}`);
    console.log(``);
    return contractProxy;
}


export {
    deployDirect, deploy, deployProxy
}