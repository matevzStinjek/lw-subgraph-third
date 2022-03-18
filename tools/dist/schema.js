"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchema = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const helpers_1 = require("./helpers");
const createSourceString = (contractName) => {
    const { address, startBlock } = helpers_1.getContract(contractName);
    const key = `source${contractName}`;
    const value = `
      address: '${address}'
      abi: ${contractName}
      startBlock: ${startBlock}`;
    return [key, value];
};
const generateSchema = async (contracts, items, input, output) => {
    const template = handlebars_1.default.compile(input);
    const result = template({ ...Object.fromEntries(contracts.map(createSourceString)), ...items });
    fs_1.default.writeFileSync(output, result);
    return result;
};
exports.generateSchema = generateSchema;
//# sourceMappingURL=schema.js.map