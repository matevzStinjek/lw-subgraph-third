import path from "path";
import fs from "fs";

export const readJson = (path: string) =>
  JSON.parse(fs.readFileSync(`${path}.json`, "utf8"));

export const id = {
  localhost: 43111,
  fuji: 43113,
  avalanche: 43114,
};

export const network = process.env.NETWORK as string;
export const chainId = id[network];
export const getContract = (contractName: string) =>
  readJson(path.join(process.env.CONTRACTS as string, chainId.toString()))
    .contracts[contractName];
