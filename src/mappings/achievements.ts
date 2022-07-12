// common
import { createUserIfNotExist, createTokenTransaction } from "./common";

// schema
import { Badge } from "../types/schema";

// dataSources
import {
    NewClone as NewCloneEvent,
} from "../types/BetaLostAchievementFactoryClone/BetaLostAchievementFactoryClone";

// templates
import { 
    BetaLostAchievement as BetaLostAchievementTemplate,
    GammaLostAchievement as GammaLostAchievementTemplate,
} from "../types/templates";

import {
    Transfer as TransferEvent,
} from "../types/templates/BetaSimpleFlatLostWorld/BetaSimpleFlatLostWorld";


export function handleNewBetaAchievementRegistered (event: NewCloneEvent): void {
    BetaLostAchievementTemplate.create(event.params.clone);
}

export function handleNewGammaAchievementRegistered (event: NewCloneEvent): void {
    GammaLostAchievementTemplate.create(event.params.clone);
}

export function handleBadgeClaimed (event: TransferEvent): void {
    let id = event.address.toHexString().toLowerCase() + "::" + event.params.tokenId.toString();
    let badge = new Badge(id);
    badge.owner = createUserIfNotExist(event.params.to);
    badge.tokenID = event.params.tokenId.toI32();
    badge.achievement = event.address;
    badge.achievedAt = event.block.timestamp.toI32();
    badge.save();

    createTokenTransaction(id, event);
}
