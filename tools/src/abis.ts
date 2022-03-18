import yaml from "js-yaml"
import path from "path";
import fs from "fs";

import { getContract } from "./helpers";
export const generateAbis = (yamlText: string, abiOutput: string) => {
    const { templates, dataSources } = yaml.load(yamlText);
    const contracts = new Set<string>(
        [...templates, ...dataSources].map(({ name } ) => name)
    )
    console.log(contracts)
    contracts.forEach(contract => {
        const { abi } = getContract(contract);
        fs.writeFileSync(path.join(abiOutput, `${contract}.json`), JSON.stringify(abi))
    })
}
