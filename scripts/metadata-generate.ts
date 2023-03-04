import fst from "fs";
const Metadata = "./metadata/";
class MetadataGenerate {
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
  writeImage(cidImage: string, maxSupply: number) {
    for (let i = 1; i < maxSupply + 1; i++) {
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
      fst.writeFile(
        `${Metadata}/${i}.${this.fileExt}`,
        JSON.stringify(newElement),
        "utf-8",
        function (err) {
          if (err) throw err;
          console.log("WriteSuccess", i);
        }
      );
    }
  }
}

const main = () => {
  const metadataHelper = new MetadataGenerate({
    name: "Spider Hero",
    desc: "Hero NFT is an test collections",
  });
  metadataHelper.writeImage(
    "QmdpxMc5u3r2mk7uUT1ip7MeVybuAM8aXKJmXnBRH8xv9n",
    28
  );
};

main();
