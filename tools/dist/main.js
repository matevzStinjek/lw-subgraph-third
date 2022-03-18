"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const schema_1 = require("./schema");
const abis_1 = require("./abis");
const helpers_1 = require("./helpers");
const filePath = "subgraph.hbs";
const subgraphOutput = path_1.default.join(__dirname, "..", "subgraph.generated.yaml");
const abiOutput = path_1.default.join(__dirname, "..", "abis");
const main = async () => {
    const input = fs_1.default.readFileSync(filePath).toString();
    const dataSourcesNames = js_yaml_1.default.load(input).dataSources.map(({ name }) => name);
    const schema = await schema_1.generateSchema(dataSourcesNames, { network: helpers_1.network }, input, subgraphOutput);
    abis_1.generateAbis(schema, abiOutput);
};
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map