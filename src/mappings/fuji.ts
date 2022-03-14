// library
import { ethereum, json, log, Address, BigDecimal, BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import { decode } from "as-base64";

// schema
import { LostWorld, Project, Variation, PriceRange, Token, TokenTransaction } from "../types/schema";

// dataSources
import {
    ProxyDeployed as RandomFlatLostWorlRegisteredEvent,
} from "../types/RandomFlatLostWorldFactory/RandomFlatLostWorldFactory";

import {
    ProxyDeployed as AlphaRandomCurvedLostWorldRegisteredEvent,
} from "../types/AlphaRandomCurvedLostWorldFactory/AlphaRandomCurvedLostWorldFactory";

// templates
import { 
    AlphaRandomCurvedLostWorldV2 as AlphaRandomCurvedLostWorldV2Template,
    RandomFlatLostWorld as RandomFlatLostWorldTemplate,
} from "../types/templates";

import {
    AlphaRandomCurvedLostWorldV2Initialized as AlphaRandomCurvedLostWorldV2InitializedEvent,
    Transfer as TransferEvent,
    AlphaRandomCurvedLostWorldV2 as AlphaRandomCurvedLostWorldV2Contract,
} from "../types/templates/AlphaRandomCurvedLostWorldV2/AlphaRandomCurvedLostWorldV2";

import {
    RandomFlatLostWorldInitialized as RandomFlatLostWorldInitializedEvent,
    RandomFlatLostWorld as RandomFlatLostWorldContract,
} from "../types/templates/RandomFlatLostWorld/RandomFlatLostWorld";

// interpreters
import { ArtistLocationMetadataInterpreter as MetadataInterpreterContract } from "../types/templates/RandomFlatLostWorld/ArtistLocationMetadataInterpreter";
import { NameIssuerAdvancedVariationInterpreter as VariationInterpreterContract } from "../types/templates/RandomFlatLostWorld/NameIssuerAdvancedVariationInterpreter";
import { ImageImageLinkNameImageInformationInterpreter as ImageInterpreterContract } from "../types/templates/AlphaRandomCurvedLostWorldV1/ImageImageLinkNameImageInformationInterpreter"

export function handleAlphaRandomCurvedLostWorldRegistered (event: AlphaRandomCurvedLostWorldRegisteredEvent): void {
    let id = event.params.proxyAddress.toHexString().toLowerCase();
    let lostWorld = new LostWorld(id);
    lostWorld.type = "AlphaRandomCurvedLostWorldV2";
    lostWorld.save();

    AlphaRandomCurvedLostWorldV2Template.create(event.params.proxyAddress);
}

export function handleRandomFlatLostWorlRegistered (event: RandomFlatLostWorlRegisteredEvent): void {
    let id = event.params.proxyAddress.toHexString().toLowerCase();
    let lostWorld = new LostWorld(id);
    lostWorld.type = "RandomFlatLostWorld";
    lostWorld.save();

    RandomFlatLostWorldTemplate.create(event.params.proxyAddress);
}

export function handleAlphaRandomCurvedLostWorldV2Initialized (event: AlphaRandomCurvedLostWorldV2InitializedEvent): void {
    let id = event.address.toHexString().toLowerCase();
    let lostWorld = LostWorld.load(id);
    if (!lostWorld) {
        lostWorld = new LostWorld(id);
    }

    let contract = AlphaRandomCurvedLostWorldV2Contract.bind(event.address);

    lostWorld.totalSupply = BigInt.zero();
    lostWorld.createdTimestamp = event.block.timestamp.toI32();
    lostWorld.name = contract.name();

    // Price ranges
    let priceRanges = event.params.priceRanges_;
    for (let i = 0; i < priceRanges.length; i++) {
        let priceRangeStruct = priceRanges[i];
        let id = lostWorld.id + "-" + i.toString();
        let priceRange = new PriceRange(id);
        priceRange.threshold = priceRangeStruct.upperLimit;
        priceRange.price = priceRangeStruct.value;
        priceRange.lostWorld = event.address.toHexString();
        priceRange.save();
    }

    // context
    let context = json.fromString(event.params.context_).toObject();
    let project = context.get("project");
    if (project) {
        createProjectIfNotExist(project.toString(), event);
        lostWorld.project = project.toString();
    }

    // metadata
    let metadataInterpreter = MetadataInterpreterContract.bind(event.params.addressHolder_.metadataInterpreter);   
    let metadataStr = metadataInterpreter.interpretBytes(event.params.initializationParams_.metadata_);
    metadataStr = `{${metadataStr}}`;
    let metadata = json.fromString(metadataStr).toObject();

    let location = metadata.get("location");
    if (location) {
        lostWorld.location = location.toString();
    }
    let lat = metadata.get("lat");
    if (lat) {;
        lostWorld.lat = BigDecimal.fromString(lat.toF64().toString());
    }
    let long = metadata.get("long");
    if (long) {
        lostWorld.long = BigDecimal.fromString(long.toF64().toString());
    }
    let radius = metadata.get("radius");
    if (radius) {
        lostWorld.radius = radius.toBigInt();
    }

    // variations
    let maxSupply = 0;
    let variationInterpreter = VariationInterpreterContract.bind(event.params.addressHolder_.variationInterpreter);
    let imageInterpreter = ImageInterpreterContract.bind(event.params.addressHolder_.imageInformationInterpreter);
    for (let i = 0; i < event.params.variations_.length; i++) {
        let variationStruct = event.params.variations_[i];

        let dataStr = variationInterpreter.interpretBytes(variationStruct.data);
        dataStr = `{${dataStr}}`;

        let data = json.fromString(dataStr).toObject();
        let imageStr = imageInterpreter.interpretBytes(event.params.initializationParams_.imageLinkInformation_, variationStruct.data);
        imageStr = `{${imageStr}}`;
        let imageJson = json.fromString(imageStr).toObject();

        if (!data || !imageJson) {
            continue;
        }
        let name = data.get("name");
        if (!name) {
            continue;
        }

        let variationId = id + "-" + name.toString();
        let variation = new Variation(variationId);

        variation.name = name.toString();
        variation.totalSupply = BigInt.zero();
        maxSupply += variationStruct.amount;
        variation.maxSupply = BigInt.fromI32(variationStruct.amount);
        let image = imageJson.get("image");
        if (image) {
            variation.image = image.toString();
        }
        let artist = metadata.get("artist");
        if (artist) {
            variation.issuer = artist.toString();
        }
        variation.lostWorld = id;
        variation.save();
    }
    lostWorld.maxSupply = BigInt.fromI32(maxSupply);
    lostWorld.save();
}

export function handleRandomFlatLostWorldBaseInitialized (event: RandomFlatLostWorldInitializedEvent): void {
    let id = event.address.toHexString().toLowerCase();
    let lostWorld = LostWorld.load(id);
    if (!lostWorld) {
        return
    }

    let contract = RandomFlatLostWorldContract.bind(event.address);

    lostWorld.totalSupply = BigInt.zero();
    lostWorld.createdTimestamp = event.block.timestamp.toI32();
    lostWorld.name = contract.name();

    // Price
    lostWorld.price = event.params.price_;

    // context
    let context = json.fromString(event.params.context_).toObject();
    let project = context.get("project");
    if (project) {
        createProjectIfNotExist(project.toString(), event);
        lostWorld.project = project.toString();
    }

    // metadata
    let metadataInterpreter = MetadataInterpreterContract.bind(event.params.addressHolder_.metadataInterpreter);   
    let metadataStr = metadataInterpreter.interpretBytes(event.params.initializationParams_.metadata_);
    metadataStr = `{${metadataStr}}`;
    let metadata = json.fromString(metadataStr).toObject();

    let location = metadata.get("location");
    if (location) {
        lostWorld.location = location.toString();
    }
    let lat = metadata.get("lat");
    if (lat) {
        lostWorld.lat = BigDecimal.fromString(lat.toF64().toString());
    }
    let long = metadata.get("long");
    if (long) {
        lostWorld.long = BigDecimal.fromString(long.toF64().toString());
    }
    let radius = metadata.get("radius");
    if (radius) {
        lostWorld.radius = radius.toBigInt();
    }

    // variations
    let maxSupply = 0;
    let variationInterpreter = VariationInterpreterContract.bind(event.params.addressHolder_.variationInterpreter);
    for (let i = 0; i < event.params.variations_.length; i++) {
        let variationStruct = event.params.variations_[i];

        let dataStr = variationInterpreter.interpretBytes(variationStruct.data);
        dataStr = `{${dataStr}}`;

        let data = json.fromString(dataStr).toObject();
        let image = variationInterpreter.getImagePath(variationStruct.data);
        if (!data || !image) {
            continue;
        }
        let name = data.get("name");
        if (!name) {
            continue;
        }

        let variationId = id + "-" + name.toString();
        let variation = new Variation(variationId);

        variation.name = name.toString();
        variation.totalSupply = BigInt.zero();
        maxSupply += variationStruct.amount;
        variation.maxSupply = BigInt.fromI32(variationStruct.amount);
        variation.image = event.params.initializationParams_.imageURI_ + image;
        let issuer = data.get("issuer");
        if (issuer) {
            variation.issuer = issuer.toString();
        }
        variation.lostWorld = id;
        variation.save();
    }
    lostWorld.maxSupply = BigInt.fromI32(maxSupply);
    lostWorld.save();
}

function createProjectIfNotExist (id: string, event: ethereum.Event): void {
    let project = Project.load(id);
    if (!project) {
        project = new Project(id);
        project.createdTimestamp = event.block.timestamp.toI32();
        project.save();
    }
}

export function handleAlphaRandomCurvedLostWorldV2Transfer (event: TransferEvent): void {
    let contract = AlphaRandomCurvedLostWorldV2Contract.bind(event.address);  
    let tokenURIString = contract.tokenURI(event.params.tokenId);
    handleTransfer(event, tokenURIString);
}

export function handleRandomFlatLostWorldBaseTransfer (event: TransferEvent): void {
    let contract = RandomFlatLostWorldContract.bind(event.address);  
    let tokenURIString = contract.tokenURI(event.params.tokenId);
    handleTransfer(event, tokenURIString);
}

function handleTransfer (event: TransferEvent, tokenURIString: string): void {
    let id = event.address.toHexString().toLowerCase() + "-" + event.params.tokenId.toString();
    let token = Token.load(id);
    if (!token) {    
        token = new Token(id);

        token.tokenID = event.params.tokenId;
        token.lostWorld = event.address.toHexString();
        token.minter = event.params.to;
        token.createdTimestamp = event.block.timestamp.toI32();
        token.hasActiveOrder = false;

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
        let minterLat = tokenURI.get("minterLat");
        if (minterLat) {
            token.minterLat = BigDecimal.fromString(minterLat.toF64().toString());
        }
        let minterLong = tokenURI.get("minterLong");
        if (minterLong) {
            token.minterLong = BigDecimal.fromString(minterLong.toF64().toString());
        }
        let image = tokenURI.get("image");
        if (image) {
            token.image = image.toString();
        }
    }
    token.owner = event.params.to;
    token.updatedTimestamp = event.block.timestamp.toI32();
    token.variation = event.address.toHexString() + "-" + token.name;
    token.save();

    // add transaction
    let transactionId = event.transaction.hash.toHexString() + "-" + event.params.tokenId.toString();
    let tokenTransaction = new TokenTransaction(transactionId);
    tokenTransaction.from = event.params.from;
    tokenTransaction.to = event.params.to;
    tokenTransaction.timestamp = event.block.timestamp.toI32();
    tokenTransaction.token = id;
    tokenTransaction.save();

    // increment lostWorlds totalSupply
    let lostWorld = LostWorld.load(event.address.toHexString());
    let variation = Variation.load(token.variation);
    if (lostWorld && variation && event.params.from == Address.zero()) {
        variation.totalSupply = variation.totalSupply.plus(BigInt.fromI32(1));
        variation.save();
        
        lostWorld.totalSupply = lostWorld.totalSupply!.plus(BigInt.fromI32(1));
        lostWorld.save();
    }
}
