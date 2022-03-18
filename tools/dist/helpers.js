"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContract = exports.chainId = exports.network = exports.id = exports.readJson = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const readJson = (path) => JSON.parse(fs_1.default.readFileSync(`${path}.json`, "utf8"));
exports.readJson = readJson;
exports.id = {
    localhost: 43111,
    fuji: 43113,
    mainnet: 43114,
};
exports.network = process.env.NETWORK;
exports.chainId = exports.id[exports.network];
const getContract = (contractName) => exports.readJson(path_1.default.join(process.env.CONTRACTS, exports.chainId.toString()))
    .contracts[contractName];
exports.getContract = getContract;
//# sourceMappingURL=helpers.js.map