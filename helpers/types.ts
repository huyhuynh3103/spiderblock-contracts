export type eNetwork =
  | eEthereumNetwork
  | eBSCNetwork
  | eOptimismNetwork
  | ePolygonNetwork;

export enum eEthereumNetwork {
  goerli = "goerli",
  main = "ethereum",
  hardhat = "hardhat",
  coverage = "coverage",
}
export enum eBSCNetwork {
  main = "bsc",
  testnet = "testnet-bsc",
}
export enum eOptimismNetwork {
  main = "optimistic",
  testnet = "optimistic-testnet",
}

export enum ePolygonNetwork {
  matic = "matic",
  mumbai = "mumbai",
}
