import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";
import { read } from "./recursive-fs";
import FormData from "form-data";
import fs from "fs";
import basePathConverter from "./base-path-converter";
import constants from "./constants";
dotenv.config();

interface PiningResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate: boolean;
  _fileNums: number;
}
export default class PinataHelper {
  instance: AxiosInstance;
  constructor() {
    const headers = process.env.PINATA_JWT_TOKEN
      ? {
          Authorization: `Bearer ${process.env.PINATA_JWT_TOKEN}`,
        }
      : {
          pinata_api_key: process.env.PINATA_API_KEY ?? "",
          pinata_secret_api_key: process.env.PINATA_API_SECRET_KEY ?? "",
        };
    this.instance = axios.create({
      baseURL: constants.pinata.BASE_URL,
      headers,
    });
  }
  async testAuth() {
    const res = await this.instance.get("/data/testAuthentication");
    return res;
  }
  async pinADirectory(dirPath: string): Promise<PiningResponse> {
    const { dirs, files } = await read(dirPath);
    let data = new FormData();
    for (const file of files) {
      data.append(`file`, fs.createReadStream(file), {
        filepath: basePathConverter(dirPath, file),
      });
    }
    const res = await this.instance.request({
      method: "POST",
      url: "/pinning/pinFileToIPFS",
      data,
      headers: {
        "Content-Type": `multipart/formdata`,
      },
    });
    return { ...res.data, _fileNums: files.length };
  }
  async pinAFile() {}
}
