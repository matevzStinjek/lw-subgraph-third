import { log } from "@graphprotocol/graph-ts"

// common
import { createUserIfNotExist, createTokenTransaction } from "./common";

// schema
import { Token } from "../types/schema";

// dataSources
import {
    ProxyDeployed as AlphaRandomCurvedLostWorldRegisteredEvent,
} from "../types/AlphaRandomCurvedLostWorldFactory/AlphaRandomCurvedLostWorldFactory";

import {
    ProxyDeployed,
} from "../types/BetaSimpleFlatLostWorldFactory/BetaSimpleFlatLostWorldFactory";

// templates
import { 
    AlphaRandomCurvedLostWorld as AlphaRandomCurvedLostWorldTemplate,
    BetaRandomFlatLostWorld as BetaRandomFlatLostWorldTemplate,
    BetaSimpleFlatLostWorld as BetaSimpleFlatLostWorldTemplate,
    GammaRandomFlatLostWorld as GammaRandomFlatLostWorldTemplate,
    GammaSimpleFlatLostWorld as GammaSimpleFlatLostWorldTempalte,
} from "../types/templates";

import {
    Transfer as TransferEvent,
} from "../types/templates/BetaSimpleFlatLostWorld/BetaSimpleFlatLostWorld";


// register templates
export function handleAlphaRandomCurvedLostWorldRegistered (event: AlphaRandomCurvedLostWorldRegisteredEvent): void {
    // Ignore Genesis
    if (event.params.proxyAddress.toHexString().toLowerCase() == "0x695f4015d80d6e1ceae875373fed8573483525bb") {
        return;
    }
    AlphaRandomCurvedLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleBetaRandomFlatLostWorldRegistered (event: ProxyDeployed): void {
    BetaRandomFlatLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleBetaSimpleFlatLostWorldRegistered (event: ProxyDeployed): void {
    BetaSimpleFlatLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleGammaRandomFlatLostWorldRegistered (event: ProxyDeployed): void {
    GammaRandomFlatLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleGammaSimpleFlatLostWorldRegistered (event: ProxyDeployed): void {
    GammaSimpleFlatLostWorldTempalte.create(event.params.proxyAddress);
}

// handle transfers
export function handleTransfer (event: TransferEvent): void {
    let id = event.address.toHexString().toLowerCase() + "::" + event.params.tokenId.toString();
    let token = Token.load(id);
    if (!token) {    
        token = new Token(id);

        token.tokenID = event.params.tokenId.toI32();
        token.lostWorld = event.address;
        token.minter = createUserIfNotExist(event.params.to);
        token.createdTimestamp = event.block.timestamp.toI32();
        token.hasActiveOrder = false;
    }
    
    token.owner = createUserIfNotExist(event.params.to);
    token.updatedTimestamp = event.block.timestamp.toI32();
    token.save();

    createTokenTransaction(id, event);
}
