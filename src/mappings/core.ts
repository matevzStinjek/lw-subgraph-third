import {
    Address,
    Bytes,
    BigDecimal,
    json,
    store,
} from "@graphprotocol/graph-ts";

import {
    LostLayer,
    LostWorld,
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
    lostWorld.name = event.params.id_.toString();
    lostWorld.lostLayer = event.address.toHexString();

    let contract = CurvedRandomLostWorldContract.bind(event.params.address_);

    lostWorld.totalSupply = contract.totalSupply();
    lostWorld.maxSupply = contract.maxSupply();

    let lens = LostWorldLensContract.bind(Address.fromString("0x55aBc3dEBFfD21180B23F6E9868232A1Ec1358D4"))

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

    // TODO #1: fix
    // if (lostWorld.tokens && lostWorld.tokens.length > 0) {
    //     lostWorld.tokens.forEach(id => {
    //         store.remove("Token", id)
    //     })
    // }
    store.remove("LostWorld", address.toHexString());
}
