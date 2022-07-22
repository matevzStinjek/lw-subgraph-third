import { log } from "@graphprotocol/graph-ts"

import { createUserIfNotExist } from "./common";

import { Token, Order } from "../types/schema";

import {
    OrdedAdded as OrderAddedEvent,
    OrderExecuted as OrderExecutedEvent,
    OrderRemoved as OrderRemovedEvent,
} from "../types/LostWorldsMarketplace/LostWorldsMarketplace";


export function handleAlphaLostWorldsMarketplaceV1OrderAdded (event: OrderAddedEvent): void {
    handleOrderAdded(event, "AlphaLostWorldsMarketplace", "V1");
}

export function handleLostWorldsMarketplaceOrderAdded (event: OrderAddedEvent): void {
    handleOrderAdded(event, "LostWorldsMarketplace", "M");
}

function handleOrderAdded (event: OrderAddedEvent, marketplace: string, idPrefix: string): void {    
    let id = idPrefix + "::" + event.params.orderId.toString();
    let lostWorld = event.params.token.toHexString().toLowerCase();

    let order = new Order(id);
    order.orderId = event.params.orderId.toI32();
    order.token = lostWorld + "::" + event.params.tokenId.toString();
    order.marketplace = marketplace;
    order.price = event.params.price;
    order.seller = createUserIfNotExist(event.params.seller);
    order.isOpen = true;
    order.isExecuted = false;
    order.createdTimestamp = event.block.timestamp.toI32();
    order.updatedTimestamp = event.block.timestamp.toI32();

    let token = Token.load(order.token);
    if (token) {
        token.hasActiveOrder = true;
        token.activeOrder = order.id;
        order.seller = createUserIfNotExist(event.params.seller);
        token.updatedTimestamp = event.block.timestamp.toI32();
        token.save();
    }
    order.save();
}


export function handleAlphaLostWorldsMarketplaceV1OrderExecuted (event: OrderExecutedEvent): void {
    handleOrderExecuted(event, "V1");
}

export function handleLostWorldsMarketplaceOrderExecuted (event: OrderExecutedEvent): void {
    handleOrderExecuted(event, "M");
}

function handleOrderExecuted (event: OrderExecutedEvent, idPrefix: string): void {
    let id = idPrefix + "::" + event.params.orderId.toString();
    let order = Order.load(id);
    if (!order) {
        return;
    }
    order.isOpen = false;
    order.isExecuted = true;
    order.buyer = createUserIfNotExist(event.params.buyer);
    order.updatedTimestamp = event.block.timestamp.toI32();
    order.save();

    let token = Token.load(order.token);
    if (token) {
        token.hasActiveOrder = false;
        token.activeOrder = null;
        token.seller = null;
        token.updatedTimestamp = event.block.timestamp.toI32();
        token.save();
    }
}


export function handleAlphaLostWorldsMarketplaceV1OrderRemoved (event: OrderRemovedEvent): void {
    handleOrderRemoved(event, "V1");
}

export function handleLostWorldsMarketplaceOrderRemoved (event: OrderRemovedEvent): void {
    handleOrderRemoved(event, "M");
}

function handleOrderRemoved (event: OrderRemovedEvent, idPrefix: string): void {
    let id = idPrefix + "::" + event.params.orderId.toString();
    let order = Order.load(id);
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
        token.seller = null;
        token.updatedTimestamp = event.block.timestamp.toI32();
        token.save();
    }
}
