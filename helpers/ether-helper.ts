import { ethers } from "ethers";

export function parseEther (amount: Number) {
	return ethers.utils.parseUnits(amount.toString(), 18);
}

export function keccak256 (input: string):string {
	return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(input)).toString();
}