import { eEthereumNetwork, eNetwork, ePolygonNetwork, eBSCNetwork } from './helpers/types';
import { HardhatUserConfig, task } from "hardhat/config";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import { NETWORKS_RPC_URL } from './helper-hardhat-config';
import { HttpNetworkAccountsUserConfig, NetworkUserConfig } from 'hardhat/types';
import { accounts } from './helpers/test-wallets';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || '';
const MNEMONIC_PATH = "m/44'/60'/0'/0"; // BIP44: used for creating ERC20 standard tokenomic, such as Ethereum
const MNEMONIC = process.env.MNEMONIC || ''
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''


const accountsToUse : HttpNetworkAccountsUserConfig  = 
  PRIVATE_KEY === '' 
    ? {
      mnemonic: MNEMONIC,
      path: MNEMONIC_PATH,
      initialIndex: 0,
      count: 20
    } : [PRIVATE_KEY]

const getCommonNetworkConfig = (networkName: eNetwork, chainId: number): NetworkUserConfig => ({
  url: NETWORKS_RPC_URL[networkName],
  chainId,
  accounts: accountsToUse,
});


const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1_000_000
      },
      metadata: {
        bytecodeHash: 'none',
      }
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5'
  },
  etherscan : {
    apiKey: {
      bscTestnet: BSCSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      ethereum: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY
    }
  },
  networks: {
    goerli: getCommonNetworkConfig(eEthereumNetwork.goerli, 5),
    ethereum: getCommonNetworkConfig(eEthereumNetwork.main, 1),
    matic: getCommonNetworkConfig(ePolygonNetwork.matic, 80001),
    mumbai: getCommonNetworkConfig(ePolygonNetwork.mumbai, 100),
    hardhat: {
      accounts: accounts.map(({ secretKey, balance }: { secretKey: string; balance: string }) => ({
        privateKey: secretKey,
        balance,
      })),
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
    },
    bsc: getCommonNetworkConfig(eBSCNetwork.main, 56),
    bscTest: getCommonNetworkConfig(eBSCNetwork.testnet, 97)

  }
};
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for(const account of accounts){
    console.log(account.address)
  }
})
export default config;
