import { Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { clearStore, test, assert, newMockEvent } from "matchstick-as/assembly/index";
import { log } from "matchstick-as/assembly/log";
import { logStore } from "matchstick-as/assembly/store";
import { LostWorld, Token } from "../src/types/schema";

import { Transfer } from "../src/types/templates/LostWorld/CurvedRandomLostWorld";
import { handleTransfer } from "../src/mappings/leaves";

let LOST_WORLD = "LostWorld";
let TOKEN = "Token";

let LOST_LAYER_ADDRESS = "0x4317f40883b8539e730e94d272d233c76961e752";
let LOST_WORLD_ADDRESS = "0xe803A0Ff746E16CBA81601b412747976C30ff744";
let ADDRESS_ZERO = Address.zero().toHexString();
let USER_1 = "0xa9b685d326adcb2b7883dbf6bb424f92215c2ffe"

test("handleTransfer", () => {
  // Seed a LostWorld
  let lostWorld = new LostWorld(LOST_WORLD_ADDRESS);
  lostWorld.address = Bytes.fromHexString(LOST_WORLD_ADDRESS) as Bytes;
	lostWorld.key = Bytes.fromHexString(ADDRESS_ZERO) as Bytes;
	lostWorld.name = "Test LW";
	lostWorld.lostLayer = LOST_LAYER_ADDRESS;
	lostWorld.artist = "Kanye";
	lostWorld.location = "New York";
	lostWorld.lat = BigDecimal.fromString("1.00");
	lostWorld.long = BigDecimal.fromString("2.00");
	lostWorld.radius = BigInt.fromI32(50);
	lostWorld.totalSupply = BigInt.fromI32(0);
	lostWorld.maxSupply = BigInt.fromI32(20);
  lostWorld.save();

  // Assert seeded LostWorld saved correctly
  assert.fieldEquals("LostWorld", LOST_WORLD_ADDRESS, "name", "Test LW");
  assert.fieldEquals(LOST_WORLD, LOST_WORLD_ADDRESS, "totalSupply", "0");

  // Seed a Token
  let token = new Token("0x123-1");
  token.tokenID = BigInt.fromI32(1);
  token.lostWorld = LOST_WORLD_ADDRESS;
  token.save();
  
  // Asset seeded token saved correctly
  assert.fieldEquals(TOKEN, token.id, "tokenID", token.tokenID.toString());
  assert.fieldEquals(TOKEN, token.id, "lostWorld", LOST_WORLD_ADDRESS);

  logStore();

  log.success(
    (Address.fromString(LOST_WORLD_ADDRESS) as Address).toHexString(), []
  );
  
  // Create new Transfer(0x0, 0xa9b, 2) event
  let tokenID = BigInt.fromI32(2);
  let newTransferEvent = createNewTransferEvent(ADDRESS_ZERO, USER_1, tokenID, LOST_WORLD_ADDRESS);

  handleTransfer(newTransferEvent);

  // Assert "minted" token saved correctly
  let id = newTransferEvent.address.toHexString() + "-" + newTransferEvent.params.tokenId.toString();
  assert.fieldEquals(TOKEN, id, "tokenID", newTransferEvent.params.tokenId.toString());
  assert.fieldEquals(TOKEN, id, "lostWorld", newTransferEvent.address.toHexString());


  // Assert totalSupply was incremented
  assert.fieldEquals(LOST_WORLD, LOST_WORLD_ADDRESS, "totalSupply", "1");

  clearStore();
})

function createNewTransferEvent (
  from: string,
  to: string,
  tokenId: BigInt,
  address: string,
): Transfer {
  let fromAddress = Address.fromString(from) as Address;
  let toAddress = Address.fromString(to) as Address;

  log.debug("address1 {} ", [(Address.fromString(address) as Address).toHex()]);
  log.debug("address2 {} ", [(Address.fromString(address) as Address).toHexString()]);

  let mockEvent = newMockEvent();
  let newTransferEvent = new Transfer(
    Address.fromString(address) as Address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
  );
  
  newTransferEvent.parameters = new Array();
  
  let fromParam = new ethereum.EventParam("from", ethereum.Value.fromAddress(fromAddress));
  let toParam = new ethereum.EventParam("to", ethereum.Value.fromAddress(toAddress));
  let tokenIdParam = new ethereum.EventParam("tokenId", ethereum.Value.fromSignedBigInt(tokenId));
  
  newTransferEvent.parameters.push(fromParam);
  newTransferEvent.parameters.push(toParam);
  newTransferEvent.parameters.push(tokenIdParam);
  return newTransferEvent;
}
