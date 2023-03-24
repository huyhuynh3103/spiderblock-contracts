import { upgradeProxy } from "../helpers/upgrade";

async function main(): Promise<void> {
	upgradeProxy("Auction", "0x7FDC4475c948eE3Ba33fE0b5f7FF8e4e63EBea63")
}

main().catch((error)=>{
	console.error(error);
	process.exitCode = 1;
})