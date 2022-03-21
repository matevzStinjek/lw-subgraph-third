// @ts-nocheck
import handlebars from "handlebars";
import fs from "fs";
import { getContract } from "./helpers";

const createSourceString = (contractName: string) => {
  const { address, blockNumber } = getContract(contractName);
  const key = `source${contractName}`;
  const value = 
      `address: '${address}'
      abi: ${contractName}
      startBlock: ${blockNumber}`;
  return [key, value];
};


export const generateSchema = async (contracts: string[], items: any, input: string, output: string) => {
  const template = handlebars.compile(input);
  const result = template( { ...Object.fromEntries(contracts.map(createSourceString)), ...items });
  fs.writeFileSync(output, result);
  return result;
};
