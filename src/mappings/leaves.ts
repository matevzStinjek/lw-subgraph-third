import { Address, BigInt, BigDecimal, Bytes, log, json } from "@graphprotocol/graph-ts";

import {
    LostWorld,
    Token,
} from "../types/schema"

import {
    CurvedRandomLostWorld as CurvedRandomLostWorldContract,
    Transfer as TransferEvent,
} from "../types/templates/LostWorld/CurvedRandomLostWorld"

export function handleTransfer (event: TransferEvent): void {
    // TODO #1: fix token deletion
    if (event.address.toHexString() == "0x695f4015d80d6e1ceae875373fed8573483525bb") {
        return;
    }

    let id = event.address.toHexString().toLowerCase() + "-" + event.params.tokenId.toString();
    let token = Token.load(id);
    if (!token) {    
      token = new Token(id);
    }

    token.tokenID = event.params.tokenId;
    token.lostWorld = event.address.toHexString();
    token.owner = event.params.to;

    let contract = CurvedRandomLostWorldContract.bind(event.address);

    let tokenURIString = contract.tokenURI(event.params.tokenId).slice(22);
    let tokenURIBytes = Bytes.fromUTF8(tokenURIString) as Bytes;
    let tokenURI = json.fromBytes(tokenURIBytes).toObject();

    let name = tokenURI.get("name");
    if (name) {
        token.name = name.toString();
    }
    let minterLat = tokenURI.get("minterLat");
    if (minterLat) {
        token.minterLat = BigDecimal.fromString(minterLat.toF64().toString());
    }
    let minterLong = tokenURI.get("minterLat");
    if (minterLong) {
        token.minterLat = BigDecimal.fromString(minterLong.toF64().toString());
    }
    let image = tokenURI.get("image");
    if (image) {
        token.image = image.toString();
    }
    let imageLink = tokenURI.get("imageLink");
    if (imageLink) {
        token.imageIPFS = imageLink.toString();
    }
    token.save();

    let lostWorld = LostWorld.load(event.address.toHexString().toLowerCase());
    if (lostWorld && event.params.from == Address.zero()) {
        lostWorld.totalSupply = lostWorld.totalSupply.plus(BigInt.fromI32(1));
        lostWorld.save();
    }
}
