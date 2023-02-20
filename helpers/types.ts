export type eNetwork =
  | eEthereumNetwork
  | eBSCNetwork
  | eOptimismNetwork
  | ePolygonNetwork;

export enum eEthereumNetwork {
  goerli = "goerli",
  mainnet = "mainnet",
  hardhat = "hardhat",
  coverage = "coverage",
}
export enum eBSCNetwork {
  main = "bsc",
  testnet = "bscTestnet",
}
export enum eOptimismNetwork {
  main = "optimistic",
  testnet = "optimistic-testnet",
}

export enum ePolygonNetwork {
  matic = "matic",
  mumbai = "mumbai",
}
