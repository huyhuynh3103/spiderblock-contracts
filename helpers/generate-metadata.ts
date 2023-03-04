import fst from "fs";
export default class MetadataGenerate {
  name: string;
  description: string;
  imageExt: string;
  fileExt: string;
  constructor({ name = "", desc = "", imgExt = "png", fileExt = "json" }) {
    this.name = name;
    this.description = desc;
    this.imageExt = imgExt;
    this.fileExt = fileExt;
  }
  getRandom(max: number) {
    return Math.floor(Math.random() * max) + 1;
  }
  async writeImage(dirPath: string, cidImage: string, maxSupply: number) {
    for (let i = 0; i < maxSupply; i++) {
      const newElement = {
        name: this.name,
        description: this.description,
        image: `ipfs://${cidImage}/${i}.${this.imageExt}`,
        attributes: [
          { trait_type: "Rarity", value: this.getRandom(3) },
          { trait_type: "Class", value: this.getRandom(3) },
          { trait_type: "Level", value: this.getRandom(32) },
          { trait_type: "Move Speed", value: this.getRandom(200) },
          { trait_type: "Attack Speed", value: this.getRandom(300) },
          { trait_type: "Strength", value: this.getRandom(32) },
          { trait_type: "Stamina", value: this.getRandom(15) },
          { trait_type: "Blood", value: this.getRandom(100) },
          { trait_type: "WinCount", value: this.getRandom(300) },
        ],
      };
      await fst.promises.writeFile(
        `${dirPath}/${i}.${this.fileExt}`,
        JSON.stringify(newElement),
        "utf-8"
      );
    }
  }
}
