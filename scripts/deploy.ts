import { BigNumberish, Contract, ContractFactory, Signer } from "ethers";
import { concat } from "ethers/lib/utils";
import { ethers } from "hardhat";
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
async function main() {
  const contractSigner: Signer = ethers.provider.getSigner();

  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("0.0001");

  await deploy([unlockTime], 'Lock', contractSigner, lockedAmount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
