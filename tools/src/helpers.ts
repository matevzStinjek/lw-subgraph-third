import path from "path";
import fs from "fs";

export const readJson = (path: string) =>
  JSON.parse(fs.readFileSync(`${path}.json`, "utf8"));

export const network = process.env.NETWORK as string;
export const getContract = (contractName: string) => {
  console.log(contractName, Object.keys(readJson(path.join(process.env.CONTRACTS as string, network)).contracts))
  return readJson(path.join(process.env.CONTRACTS as string, network))
    .contracts[contractName];
}
