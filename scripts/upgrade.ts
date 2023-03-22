import { upgradeProxy } from "../helpers/upgrade";

async function main(): Promise<void> {
	upgradeProxy("FLPCrowdsale", "0x5144DcC0eE9863afCC65D75578b8F424Faf46A53")
}

main().catch((error)=>{
	console.error(error);
	process.exitCode = 1;
})