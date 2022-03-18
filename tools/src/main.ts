import dotenv from "dotenv";
dotenv.config();
import path from "path";
import fs from "fs";
import yaml from "js-yaml";
import { generateSchema } from "./schema";
import { generateAbis } from "./abis";
import { network } from "./helpers";

const filePath: string = "subgraph.hbs";

const subgraphOutput = path.join(__dirname, "..", "subgraph.generated.yaml");
const abiOutput = path.join(__dirname, "..", "..", "abis");

const main = async () => {
  const input = fs.readFileSync(filePath).toString()
  const dataSourcesNames = yaml.load(input).dataSources.map(({name}) => name)
  const schema = await generateSchema(dataSourcesNames, { network }, input, subgraphOutput);
  generateAbis(schema, abiOutput)
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
