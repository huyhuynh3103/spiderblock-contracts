import { iParamsPerNetworkAll } from "./helpers/interface";
import {
  eEthereumNetwork,
  ePolygonNetwork,
  eOptimismNetwork,
  eBSCNetwork,
} from "./helpers/types";

const INFURA_KEY = process.env.INFURA_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";

export const NETWORKS_RPC_URL: iParamsPerNetworkAll<string> = {
  [eEthereumNetwork.goerli]: ALCHEMY_KEY
    ? `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://goerli.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.mainnet]: ALCHEMY_KEY
    ? `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`
    : `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [eEthereumNetwork.coverage]: "http://localhost:8555",
  [eEthereumNetwork.hardhat]: "http://localhost:8545",
  [ePolygonNetwork.mumbai]: "https://rpc-mumbai.maticvigil.com",
  [ePolygonNetwork.matic]: "https://rpc-mainnet.matic.network",
  [eOptimismNetwork.main]: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eOptimismNetwork.testnet]: `https://opt-kovan.g.alchemy.com/v2/${ALCHEMY_KEY}`,
  [eBSCNetwork.main]: "https://bsc-dataseed1.binance.org/",
  [eBSCNetwork.testnet]: "https://data-seed-prebsc-2-s2.binance.org:8545",
};
