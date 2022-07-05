// library
import { ethereum, json, log, Bytes } from "@graphprotocol/graph-ts";
import { decode } from "as-base64";

// common
import { createUserIfNotExist, createTokenTransaction } from "./common";

// schema
import { Badge } from "../types/schema";

// dataSources
import {
    NewClone as NewCloneEvent,
} from "../types/LostAchievementFactoryClone/LostAchievementFactoryClone";

// templates
import { 
    LostAchievement as LostAchievementTemplate,
} from "../types/templates";

import {
    LostAchievement as LostAchievementContract,
} from "../types/templates/LostAchievement/LostAchievement"


import {
    Transfer as TransferEvent,
} from "../types/templates/FlatSingleLostWorld/FlatSingleLostWorld";


export function handleNewAchievementClone (event: NewCloneEvent): void {
    LostAchievementTemplate.create(event.params.clone);
}

export function handleBadgeClaimed (event: TransferEvent): void {
    let id = event.address.toHexString().toLowerCase() + "::" + event.params.tokenId.toString();
    let badge = new Badge(id);

    badge.owner = createUserIfNotExist(event.params.to);
    badge.tokenID = event.params.tokenId;
    badge.achievement = event.address;

    let contract = LostAchievementContract.bind(event.address);
    let tokenURIString = contract.tokenURI(event.params.tokenId);
    tokenURIString = tokenURIString.slice("data:application/json;base64,".length);
    tokenURIString = Bytes.fromUint8Array(decode(tokenURIString)).toString();

    let tokenURIBytes = Bytes.fromUTF8(tokenURIString) as Bytes;
    let tokenURI = json.fromBytes(tokenURIBytes).toObject();

    let achievedAt = tokenURI.get("achievedAt");
    if (achievedAt) {
        badge.achievedAt = achievedAt.toBigInt().toI32();
    }
    badge.save();

    createTokenTransaction(id, event);
}
