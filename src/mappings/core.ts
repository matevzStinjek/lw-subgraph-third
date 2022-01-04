import {
    Address,
    Bytes,
    BigInt,
    BigDecimal,
    json,
    store,
} from "@graphprotocol/graph-ts";

import {
    LostLayer,
    LostWorld,
    PriceRange,
    Variation,
} from "../types/schema";

import {
    LostLayer as LostLayerTemplate,
    LostWorld as LostWorldTemplate,
} from "../types/templates";

import {
    LostLayer as LostLayerContract,
    LostLayerRegistered as LostLayerRegisteredEvent,
    LostLayerUnregistered as LostLayerUnregisteredEvent,
} from "../types/templates/LostLayer/LostLayer";

import {
    CurvedRandomLostWorld as CurvedRandomLostWorldContract,
} from "../types/templates/LostWorld/CurvedRandomLostWorld"

import {
    LostWorldLens as LostWorldLensContract,
} from "../types/templates/LostLayer/LostWorldLens";


export function handleLostLayerRegistered (event: LostLayerRegisteredEvent): void {
    let isLostLayer = LostLayerContract.bind(event.params.address_).supportsInterface(Bytes.fromHexString("0x7c6b580e") as Bytes); // LostLayer | LostWorld
    if (isLostLayer) {
        registerLostLayer(event);
    } else {
        registerLostWorld(event);
    }
}

function registerLostLayer (event: LostLayerRegisteredEvent): void {
    let id = event.params.address_.toHexString().toLowerCase();
    let lostLayer = LostLayer.load(id);
    if (!lostLayer) {
        lostLayer = new LostLayer(id);
    }

    lostLayer.address = event.params.address_;
    lostLayer.key = event.params.id_;
    lostLayer.name = event.params.id_.toString();
    lostLayer.parent = event.address.toHexString();
    lostLayer.createdTimestamp = event.block.timestamp.toI32();
    lostLayer.save();

    LostLayerTemplate.create(event.params.address_);
}

function registerLostWorld (event: LostLayerRegisteredEvent): void {
    let id = event.params.address_.toHexString().toLowerCase();
    let lostWorld = LostWorld.load(id);
    if (!lostWorld) {
        lostWorld = new LostWorld(id);
    }

    lostWorld.address = event.params.address_;
    lostWorld.key = event.params.id_;
    lostWorld.parsedKey = event.params.id_.toString();
    lostWorld.lostLayer = event.address.toHexString();

    let contract = CurvedRandomLostWorldContract.bind(event.params.address_);

    lostWorld.totalSupply = contract.totalSupply();
    lostWorld.maxSupply = contract.maxSupply();
    lostWorld.createdTimestamp = event.block.timestamp.toI32();
    lostWorld.name = contract.name();

    // Price ranges
    let priceRanges = contract.priceRanges();
    for (let i = 0; i < priceRanges.length; i++) {
        let priceRangeStruct = priceRanges[i];
        let id = lostWorld.id + "-" + i.toString();
        let priceRange = new PriceRange(id);
        priceRange.threshold = priceRangeStruct.upperLimit;
        priceRange.price = priceRangeStruct.value;
        priceRange.lostWorld = event.params.address_.toHexString();
        priceRange.save();
    }

    // Lens: metadata & variations
    let lens = LostWorldLensContract.bind(Address.fromString("0x55aBc3dEBFfD21180B23F6E9868232A1Ec1358D4"))

    // metadata
    let metadataString = lens.metadata(event.params.address_);
    let metadataBytes = Bytes.fromUTF8(metadataString) as Bytes;
    let metadata = json.fromBytes(metadataBytes).toObject();

    let artist = metadata.get("artist");
    if (artist) {
        lostWorld.artist = artist.toString();
    }
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
    let variationsString = lens.variations(event.params.address_);
    let variationsBytes = Bytes.fromUTF8(variationsString) as Bytes;
    let variations = json.fromBytes(variationsBytes).toArray();
    for (let i = 0; i < variations.length; i++) {
        let variationStruct = variations[i].toObject();
        let data = variationStruct.get("data");
        if (!data) {
            continue;
        }
        let dataObj = data.toObject();
        let name = dataObj.get("name");
        if (!name) {
            continue;
        }
        let variationId = id + "-" + name.toString();
        let variation = new Variation(variationId);
        variation.name = name.toString();
        variation.totalSupply = BigInt.zero();

        let amount = variationStruct.get("amount");
        if (amount) {
            variation.maxSupply = amount.toBigInt();
        }
        let image = dataObj.get("image");
        if (image) {
            variation.image = image.toString();
        }
        let imageLink = dataObj.get("imageLink");
        if (imageLink) {
            variation.imageIPFS = imageLink.toString();
        }
        variation.lostWorld = id;
        variation.save();
    }

    lostWorld.save();

    LostWorldTemplate.create(event.params.address_);
}

export function handleLostLayerUnregistered (event: LostLayerUnregisteredEvent): void {
    let address = event.params.address_;
    let isLostLayer = LostLayerContract.bind(address).supportsInterface(Bytes.fromHexString("0x7c6b580e") as Bytes); // LostLayer | LostWorld
    if (isLostLayer) {
        removeLostLayer(address);
    } else {
        removeLostWorld(address);
    }
}

function removeLostLayer (address: Address): void {
    let lostLayer = LostLayer.load(address.toHexString().toLowerCase());
    if (!lostLayer) {
        return;
    }

    if (lostLayer.lostLayers && lostLayer.lostLayers.length > 0) {
        lostLayer.lostLayers.forEach(address => {
            removeLostLayer(Address.fromString(address));
        })
    }
    if (lostLayer.lostWorlds && lostLayer.lostWorlds.length > 0) {
        lostLayer.lostWorlds.forEach(address => {
            removeLostWorld(Address.fromString(address));
        })
    }
    store.remove("LostLayer", address.toHexString());
}

function removeLostWorld (address: Address): void {
    let lostWorld = LostWorld.load(address.toHexString().toLowerCase());
    if (!lostWorld) {
        return;
    }

    // TODO #1: fix token deletion
    // if (lostWorld.tokens && lostWorld.tokens.length > 0) {
    //     lostWorld.tokens.forEach(id => {
    //         let token = Token.load(id);
    //         if (token) {
    //             store.remove("Token", token.id);
    //         }
    //     })
    // }
    store.remove("LostWorld", address.toHexString());
}
