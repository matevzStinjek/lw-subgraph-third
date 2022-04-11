// library
import { ethereum, json, log, Address, BigDecimal, BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";

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
    // name
    // desc
    // image
    badge.save();
}
