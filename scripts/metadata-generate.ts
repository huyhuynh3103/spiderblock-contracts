import constants from "../helpers/constants";
import MetadataGenerate from "../helpers/generate-metadata";
import PinataHelper from "../helpers/pinata";

const main = async () => {
  const metadataHelper = new MetadataGenerate({
    name: "Spider Hero",
    desc: "Hero NFT is an test collections",
  });
  const pinata = new PinataHelper();
  const imageUploadResponse = await pinata.pinADirectory(constants.nft_storage_path.image);
  console.log('Image upload', imageUploadResponse)
  await metadataHelper.writeImage(
	constants.nft_storage_path.metadata,
	imageUploadResponse.IpfsHash,
	imageUploadResponse._fileNums
  );
  const medataUploadResponse = await pinata.pinADirectory(constants.nft_storage_path.metadata);
  console.log('Metadata upload', medataUploadResponse)
};

main();
