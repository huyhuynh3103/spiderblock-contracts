import { Signer } from "ethers";
import { ethers } from "hardhat";
import { deploy, deployProxy } from "../helpers/deploy";
async function main() {
  const contractSigner: Signer = ethers.provider.getSigner();
  console.log(`Signer Address: ${await contractSigner.getAddress()}`)

  await deploy([],"Floppy", contractSigner);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
