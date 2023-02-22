import {promises as fs} from 'fs';

var config: any;
const CONFIG_FILE_PATH = '../config.json';
export async function initConfig() {
	console.log(`\nInit config ...\n`);
	config = JSON.parse((await fs.readFile(CONFIG_FILE_PATH)).toString());
	return config;
}

export function getConfig() {
	return config;
}

export function setConfig(path: string, val: string) {
	console.log(`\nSet config.json ...\n`)
	const splitPath = path.split('.').reverse();
	var ref = config;
	while(splitPath.length>1){
		let key = splitPath.pop();
		if(key) {
			if(!ref[key]) 
				ref[key] = {}
			ref = ref[key]
		} else {
			return;
		}
	}
	let key = splitPath.pop();
	if(key) {
		ref[key] = val
	}
}

export async function updateConfig() {
	console.log(`\nUpdate config.json ...\n`);
	console.log('Write: ', JSON.stringify(config))
	return fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
}
