"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAbis = void 0;
const js_yaml_1 = __importDefault(require("js-yaml"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const helpers_1 = require("./helpers");
const generateAbis = (yamlText, abiOutput) => {
    const { templates, dataSources } = js_yaml_1.default.load(yamlText);
    const contracts = new Set([...templates, ...dataSources].map(({ name }) => name));
    console.log(contracts);
    contracts.forEach(contract => {
        const { abi } = helpers_1.getContract(contract);
        fs_1.default.writeFileSync(path_1.default.join(abiOutput, `${contract}.json`), JSON.stringify(abi));
    });
};
exports.generateAbis = generateAbis;
//# sourceMappingURL=abis.js.map