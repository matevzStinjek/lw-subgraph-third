// library
import { ethereum, json, log, Address, BigDecimal, BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import { decode } from "as-base64";

// schema
import { Achievement, Badge } from "../types/schema";

// dataSources
import {
    NewClone as NewCloneEvent,
} from "../types/LostAchievementFactoryClone/LostAchievementFactoryClone";

import {
    RegisteredStakeRewarder as RegisteredStakeRewarderEvent,
} from "../types/LostAchievementChef/LostAchievementChef";

// templates
import { 
    LostAchievement as LostAchievementTemplate,
} from "../types/templates";

import {
    LostAchievementInitialized as LostAchievementInitializedEvent,
    LostAchievement as LostAchievementContract,
    Transfer as BadgeClaimedEvent,
} from "../types/templates/LostAchievement/LostAchievement"


export function handleNewAchievementClone (event: NewCloneEvent): void {
    let id = event.params.clone.toHexString().toLowerCase();
    let achievement = new Achievement(id);
    achievement.save();

    LostAchievementTemplate.create(event.params.clone);
}

export function handleLostAchievementInitialized (event: LostAchievementInitializedEvent): void {
    let id = event.address.toHexString().toLowerCase();
    let achievement = Achievement.load(id);
    if (!achievement) {
        return;
    }

    achievement.name = event.params.name_;
    achievement.image = event.params.imageURI_;

    let metadataStr = `{${event.params.metadata_}}`
    let metadata = json.fromString(metadataStr).toObject(); // name, description
    let description = metadata.get("description");
    if (description) {
        achievement.description = description.toString();
    }
    achievement.save();
}

export function handleRegisteredStakeRewarder (event: RegisteredStakeRewarderEvent): void {
    let id = event.params.address_.toHexString().toLowerCase();
    let achievement = Achievement.load(id);
    if (!achievement) {
        return;
    }

    achievement.stakeCondition = event.params.rewarder_.stakeLimit;
    achievement.lostReward = event.params.rewarder_.lostAmount;
    achievement.save();
}

export function handleBadgeClaimed (event: BadgeClaimedEvent): void {
    let id = event.address.toHexString().toLowerCase() + "-" + event.params.tokenId.toString();
    let badge = new Badge(id);

    badge.achievement = event.address.toHexString();
    badge.owner = event.params.to;
    badge.tokenID = event.params.tokenId;

    let contract = LostAchievementContract.bind(event.address);
    let tokenURIString = contract.tokenURI(event.params.tokenId);
    tokenURIString = tokenURIString.slice("data:application/json;base64,".length);
    tokenURIString = Bytes.fromUint8Array(decode(tokenURIString)).toString();

    let tokenURIBytes = Bytes.fromUTF8(tokenURIString) as Bytes;
    let tokenURI = json.fromBytes(tokenURIBytes).toObject();

    let name = tokenURI.get("name");
    if (name) {
        badge.name = name.toString();
    }
    let description = tokenURI.get("description");
    if (description) {
        badge.description = description.toString();
    }
    let achievedAt = tokenURI.get("achievedAt");
    if (achievedAt) {
        badge.achievedAt = achievedAt.toBigInt().toI32();
    }
    let image = tokenURI.get("image");
    if (image) {
        badge.image = image.toString();
    }
    badge.save();
}
