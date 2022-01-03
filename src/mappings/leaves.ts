import { Address, BigInt, store } from "@graphprotocol/graph-ts";

import {
    LostWorld,
    Token,
} from "../types/schema"

import {
    Transfer as TransferEvent,
} from "../types/templates/LostWorld/CurvedRandomLostWorld"

export function handleTransfer (event: TransferEvent): void {
    // TODO #1: fix token deletion
    if (event.address.toHexString() == "0x695f4015d80d6e1ceae875373fed8573483525bb") {
        return;
    }

    let id = event.address.toHexString() + "-" + event.params.tokenId.toString()
    let token = Token.load(id);
    if (!token) {    
      token = new Token(id);
    }

    token.tokenID = event.params.tokenId;
    token.lostWorld = event.address.toHexString();
    token.save();

    // TODO #2: fix
    let lostWorld = LostWorld.load(event.address.toHexString());
    if (lostWorld && event.params.from == Address.zero()) {
        lostWorld.totalSupply = lostWorld.totalSupply.plus(BigInt.fromI32(1));
    }
}
