import path from "path";
import fs from "fs";

export const readJson = (path: string) =>
  JSON.parse(fs.readFileSync(`${path}.json`, "utf8"));

export const network = process.env.NETWORK as string;
export const config = process.env.CONFIG as string;
export const getContract = (contractName: string) => {
  console.log(contractName, Object.keys(readJson(path.join(process.env.CONTRACTS as string, config)).contracts))
  return readJson(path.join(process.env.CONTRACTS as string, config))
    .contracts[contractName];
}
