import { Address  } from "@graphprotocol/graph-ts";
import { User, TokenTransaction } from "../types/schema";

import {
    Transfer as TransferEvent,
} from "../types/templates/BetaSimpleFlatLostWorld/BetaSimpleFlatLostWorld";


export function createUserIfNotExist (address: Address): string {
    let id = address.toHexString().toLowerCase();
    let user = User.load(id);
    if (!user) {
        user = new User(id);
        user.save();
    }
    return id;
}

export function createTokenTransaction (tokenId: string, event: TransferEvent): void {
    let transactionId = event.transaction.hash.toHexString().toLowerCase() + "::" + event.params.tokenId.toString();
    let tokenTransaction = new TokenTransaction(transactionId);
    tokenTransaction.from = createUserIfNotExist(event.params.from);
    tokenTransaction.to = createUserIfNotExist(event.params.to);
    tokenTransaction.token = tokenId;
    tokenTransaction.contract = event.address;
    tokenTransaction.timestamp = event.block.timestamp.toI32();
    tokenTransaction.save();
}
