import {promises as fs} from 'fs';

const CONFIG_FILE_PATH = './config.json';
class ConfigFile {
	private config: any;
	constructor(){}
	public async initConfig() {
		console.log(`\nInit config ...\n`);
		this.config = JSON.parse((await fs.readFile(CONFIG_FILE_PATH)).toString());
	}
	public async setConfig(path: string, val: any) {
		console.log(`\nSet config.json ...\n`)
		const splitPath = path.split('.').reverse();
		var ref = this.config;
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
	public async updateConfig(){
		console.log(`\nUpdate config.json ...\n`);
		console.log('Write: ', JSON.stringify(this.config))
		return fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(this.config, null, 2));
	}
	public getConfig() {
		return this.config;
	}
}

export default ConfigFile;

