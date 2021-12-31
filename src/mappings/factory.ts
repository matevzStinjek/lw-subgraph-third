import { store } from "@graphprotocol/graph-ts";

import {
    LostLayer,
} from "../types/schema"

import {
    LostLayer as LostLayerTemplate,
} from "../types/templates"

import {
    LostLayerRegistered as LostLayerRegisteredEvent,
    LostLayerUnregistered as LostLayerUnregisteredEvent,
} from "../types/LostLayerController/LostLayer"

export function handleLostLayerRegistered (event: LostLayerRegisteredEvent): void {
    let id = event.params.address_.toHexString();
    let lostLayer = LostLayer.load(id);
    if (!lostLayer) {
        lostLayer = new LostLayer(id);
    }

    lostLayer.address = event.params.address_;
    lostLayer.key = event.params.id_;
    lostLayer.name = event.params.id_.toString();
    lostLayer.save();

    LostLayerTemplate.create(event.params.address_);
}

export function handleLostLayerUnregistered (event: LostLayerUnregisteredEvent): void { 
    let lostLayer = LostLayer.load(event.params.id_.toHexString());
    if (!lostLayer) {
        return
    }
    store.remove('LostLayer', event.params.id_.toHexString());
}