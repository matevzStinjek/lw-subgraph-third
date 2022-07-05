// library
import { ethereum, json, log, Address, BigDecimal, BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import { decode } from "as-base64";

// common
import { createUserIfNotExist, createTokenTransaction } from "./common";

// schema
import { Token } from "../types/schema";

// dataSources
import {
    ProxyDeployed as RandomFlatLostWorlRegisteredEvent,
} from "../types/RandomFlatLostWorldFactory/RandomFlatLostWorldFactory";

import {
    ProxyDeployed as AlphaRandomCurvedLostWorldRegisteredEvent,
} from "../types/AlphaRandomCurvedLostWorldFactory/AlphaRandomCurvedLostWorldFactory";

import {
    ProxyDeployed as FlatSingleLostWorldRegisteredEvent,
} from "../types/FlatSingleLostWorldFactory/FlatSingleLostWorldFactory";

// templates
import { 
    AlphaRandomCurvedLostWorld as AlphaRandomCurvedLostWorldTemplate,
    RandomFlatLostWorld as RandomFlatLostWorldTemplate,
    FlatSingleLostWorld as FlatSingleLostWorldTemplate,
} from "../types/templates";

import {
    AlphaRandomCurvedLostWorld as AlphaRandomCurvedLostWorldContract,
} from "../types/templates/AlphaRandomCurvedLostWorld/AlphaRandomCurvedLostWorld";

import {
    RandomFlatLostWorld as RandomFlatLostWorldContract,
} from "../types/templates/RandomFlatLostWorld/RandomFlatLostWorld";

import {
    Transfer as TransferEvent,
    FlatSingleLostWorld as FlatSingleLostWorldContract,
} from "../types/templates/FlatSingleLostWorld/FlatSingleLostWorld";

// register templates
export function handleAlphaRandomCurvedLostWorldRegistered (event: AlphaRandomCurvedLostWorldRegisteredEvent): void {
    // Ignore Genesis
    if (event.params.proxyAddress.toHexString().toLowerCase() == "0x695f4015d80d6e1ceae875373fed8573483525bb") {
        return;
    }

    AlphaRandomCurvedLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleRandomFlatLostWorldRegistered (event: RandomFlatLostWorlRegisteredEvent): void {
    RandomFlatLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleFlatSingleLostWorldRegistered (event: FlatSingleLostWorldRegisteredEvent): void {
    FlatSingleLostWorldTemplate.create(event.params.proxyAddress);
}

// handle transfers
export function handleAlphaRandomCurvedLostWorldV2Transfer (event: TransferEvent): void {
    handleTransfer(event, "AlphaRandomCurvedLostWorldContract");
}

export function handleRandomFlatLostWorldTransfer (event: TransferEvent): void {
    handleTransfer(event, "RandomFlatLostWorldContract");
}

export function handleFlatSingleLostWorldTransfer (event: TransferEvent): void {
    handleTransfer(event, "FlatSingleLostWorldContract");
}

function handleTransfer (event: TransferEvent, contractType: string): void {
    let id = event.address.toHexString().toLowerCase() + "::" + event.params.tokenId.toString();
    let token = Token.load(id);
    if (!token) {    
        token = new Token(id);

        token.tokenID = event.params.tokenId;
        token.lostWorld = event.address;
        token.minter = createUserIfNotExist(event.params.to);
        token.createdTimestamp = event.block.timestamp.toI32();
        token.hasActiveOrder = false;

        let tokenURIString = "";
        if (contractType == "AlphaRandomCurvedLostWorldContract") {
            let contract = AlphaRandomCurvedLostWorldContract.bind(event.address);  
            tokenURIString = contract.tokenURI(event.params.tokenId);
        } else if (contractType == "RandomFlatLostWorldContract") {
            let contract = RandomFlatLostWorldContract.bind(event.address);  
            tokenURIString = contract.tokenURI(event.params.tokenId);
        } else if (contractType == "FlatSingleLostWorldContract") {
            let contract = FlatSingleLostWorldContract.bind(event.address);  
            tokenURIString = contract.tokenURI(event.params.tokenId);
        }
        if (tokenURIString.startsWith("data:application/json;base64,")) {
            tokenURIString = tokenURIString.slice("data:application/json;base64,".length);
            tokenURIString = Bytes.fromUint8Array(decode(tokenURIString)).toString();
        } else {
            tokenURIString = tokenURIString.slice("data:application/json,".length);
        }
        let tokenURIBytes = Bytes.fromUTF8(tokenURIString) as Bytes;
        let tokenURI = json.fromBytes(tokenURIBytes).toObject();
    
        let name = tokenURI.get("name");
        if (name) {
            token.name = name.toString();
        }
        let image = tokenURI.get("image");
        if (image) {
            token.image = image.toString();
        }
    }
    
    token.owner = createUserIfNotExist(event.params.to);
    token.updatedTimestamp = event.block.timestamp.toI32();
    token.save();

    createTokenTransaction(id, event);
}
