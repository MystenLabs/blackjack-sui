import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import fs from "fs";
import { getKeypair } from "../helpers/getKeyPair";
import { getUserRandomnessAsHexString } from "../helpers/bls/getUserRandomBytesAsHex";
import { createCounterObjectByPlayer } from "./createCounterObjectByPlayer";
import {
  BJ_PLAYER_SECRET_KEY,
  HOUSE_DATA_ID,
  PACKAGE_ADDRESS,
  SUI_NETWORK,
} from "../config";

const playerKeypair = getKeypair(BJ_PLAYER_SECRET_KEY!);

const suiClient = new SuiClient({
  url: SUI_NETWORK,
});

console.log("Player Address =  ", playerKeypair.getPublicKey().toSuiAddress());
const betAmount = "200000000";

const getCounterNftObjectIfExists = async (
  userId: string
): Promise<string | void> => {
  return suiClient
    .getOwnedObjects({
      owner: userId,
      filter: {
        StructType: `${PACKAGE_ADDRESS}::counter_nft::Counter`,
      },
    })
    .then(async (res) => {
      const objects = res?.data;
      if (objects.length > 0) {
        return objects[0]?.data?.objectId;
      }
    });
};

export const createGameByPlayer = async () => {
  console.log("Creating game...");
  const tx = new TransactionBlock();

  let counterNftId = await getCounterNftObjectIfExists(
    playerKeypair.getPublicKey().toSuiAddress()
  );
  console.log("Counter object found: ", counterNftId);
  if (!counterNftId) {
    console.log("Counter object not found, creating a new one...");
    counterNftId = await createCounterObjectByPlayer();
  }
  if (!counterNftId) {
    throw new Error("Counter NFT creation didn't work");
  }

  const betAmountCoin = tx.splitCoins(tx.gas, [tx.pure(betAmount)]);
  const randomBytesAsHexString = getUserRandomnessAsHexString();

  console.log({
    counterNftId,
    betAmountCoin,
    randomBytesAsHexString,
    HOUSE_DATA_ID,
  });

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
    arguments: [
      tx.pure(randomBytesAsHexString),
      tx.object(counterNftId!),
      betAmountCoin,
      tx.object(HOUSE_DATA_ID),
    ],
  });

  await suiClient
    .signAndExecuteTransactionBlock({
      signer: playerKeypair,
      transactionBlock: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    })
    .then((resp) => {
      const status = resp?.effects?.status.status;
      console.log("executed! status = ", status);
      if (status !== "success") {
        throw new Error("Game not created");
      }
      const createdObjects = resp.objectChanges?.filter(
        ({ type }) => type === "created"
      ) as SuiObjectChangeCreated[];
      const createdGame = createdObjects.find(({ objectType }) =>
        objectType.endsWith("single_player_blackjack::Game")
      );
      if (!createdGame) {
        throw new Error("Game not created");
      }
      const { objectId } = createdGame as any;
      console.log({ gameId: objectId });
      fs.appendFileSync("./.env", `GAME_ID=${objectId}\n`);
    });
};
