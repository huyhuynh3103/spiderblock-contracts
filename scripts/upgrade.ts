import { upgradeProxy } from "../helpers/upgrade";

async function main(): Promise<void> {
	upgradeProxy("HeroMarketplace")
}

main().catch((error)=>{
	console.error(error);
	process.exitCode = 1;
})