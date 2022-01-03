import {
    LostLayer,
} from "../types/schema"

import {
    LostLayer as LostLayerTemplate,
} from "../types/templates"

import {
    LostLayerRegistered as LostLayerRegisteredEvent,
} from "../types/LostLayerController/LostLayer"

export function handleLostLayerRegisteredFactory (event: LostLayerRegisteredEvent): void {
    let id = event.params.address_.toHexString().toLowerCase();
    let lostLayer = LostLayer.load(id);
    if (!lostLayer) {
        lostLayer = new LostLayer(id);
    }

    lostLayer.address = event.params.address_;
    lostLayer.key = event.params.id_;
    lostLayer.name = event.params.id_.toString();
    lostLayer.createdTimestamp = event.block.timestamp.toI32();
    lostLayer.save();

    LostLayerTemplate.create(event.params.address_);
}
