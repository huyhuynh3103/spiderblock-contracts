import { Signer } from "ethers";
import { ethers } from "hardhat";
import { deploy } from "../helpers/deploy";
async function main() {
  const contractSigner: Signer = ethers.provider.getSigner();

  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("0.0001");

  await deploy([unlockTime], "Lock", contractSigner, lockedAmount);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
