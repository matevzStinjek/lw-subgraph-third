import {
    Token,
    Order,
} from "../types/schema";

import {
    OrdedAdded as OrderAddedEvent,
    OrderExecuted as OrderExecutedEvent,
    OrderRemoved as OrderRemovedEvent,
} from "../types/LostWorldsMarketplace/LostWorldsMarketplace";

import { log } from "@graphprotocol/graph-ts";

export function handleOrderAdded (event: OrderAddedEvent): void {
    // TODO #1: fix token deletion
    if (event.params.token.toHexString() == "0x695f4015d80d6e1ceae875373fed8573483525bb") {
        return;
    }
    let order = new Order(event.params.orderId.toString());
    order.token = event.params.token.toHexString().toLowerCase() + "-" + event.params.tokenId.toString();
    let token = Token.load(order.token);
    if (token) {
        order.tokenName = token.name;
    }
    order.lostWorld = event.params.token.toHexString();
    order.price = event.params.price;
    order.seller = event.params.seller;
    order.isOpen = true;
    order.isExecuted = false;
    order.createdTimestamp = event.block.timestamp.toI32();
    order.updatedTimestamp = event.block.timestamp.toI32();
    order.save();

    if (token) {
        token.hasActiveOrder = true;
        token.activeOrder = order.id;
        token.save();
    }
}

export function handleOrderExecuted (event: OrderExecutedEvent): void {
    let order = Order.load(event.params.orderId.toString());
    if (!order) {
        return;
    }
    order.isOpen = false;
    order.isExecuted = true;
    order.updatedTimestamp = event.block.timestamp.toI32();
    order.save();

    let token = Token.load(order.token);
    if (token) {
        token.hasActiveOrder = false;
        token.activeOrder = null;
        token.save();
    }
}

export function handleOrderRemoved (event: OrderRemovedEvent): void {
    let order = Order.load(event.params.orderId.toString());
    if (!order) {
        return;
    }
    order.isOpen = false;
    order.updatedTimestamp = event.block.timestamp.toI32();
    order.save();

    let token = Token.load(order.token);
    if (token) {
        token.hasActiveOrder = false;
        token.activeOrder = null;
        token.save();
    }
}
