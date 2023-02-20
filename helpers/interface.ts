import {
  eEthereumNetwork,
  eBSCNetwork,
  ePolygonNetwork,
  eOptimismNetwork,
} from "./types";
export interface iEthereumParamsNetwork<T> {
  [eEthereumNetwork.goerli]: T;
  [eEthereumNetwork.coverage]: T;
  [eEthereumNetwork.mainnet]: T;
  [eEthereumNetwork.hardhat]: T;
}
export interface iBSCParamsNetwork<T> {
  [eBSCNetwork.main]: T;
  [eBSCNetwork.testnet]: T;
}
export interface iPolygonParamsNetwork<T> {
  [ePolygonNetwork.matic]: T;
  [ePolygonNetwork.mumbai]: T;
}
export interface iOptimismParamsNetwork<T> {
  [eOptimismNetwork.main]: T;
  [eOptimismNetwork.testnet]: T;
}

export interface iParamsPerNetworkAll<T>
  extends iEthereumParamsNetwork<T>,
    iPolygonParamsNetwork<T>,
    iOptimismParamsNetwork<T>,
    iBSCParamsNetwork<T> {}
