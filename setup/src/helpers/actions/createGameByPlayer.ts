import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { getUserRandomnessAsHexString } from "../bls/getUserRandomBytesAsHex";
import { createCounterObjectByPlayer } from "./createCounterObjectByPlayer";
import { PACKAGE_ADDRESS } from "../../config";
import { getCounterNftId } from "../getObject/getCounterNftId";

interface CreateGameByPlayerProps {
  suiClient: SuiClient;
  playerSecretKey: string;
  houseDataId: string;
}

export const createGameByPlayer = async ({
  suiClient,
  playerSecretKey,
  houseDataId,
}: CreateGameByPlayerProps): Promise<string | undefined> => {
  const playerKeypair = getKeypair(playerSecretKey);
  const playerPublicKey = playerKeypair.getPublicKey();
  const playerAddress = playerPublicKey.toSuiAddress();
  console.log(`Creating game for player ${playerAddress} ...`);

  const tx = new TransactionBlock();
  let counterNftId = await getCounterNftId({
    suiClient,
    address: playerAddress,
  });
  console.log("Counter object found: ", counterNftId);
  if (!counterNftId) {
    console.log("Counter object not found, creating a new one...");
    counterNftId = await createCounterObjectByPlayer({
      suiClient,
      playerSecretKey,
    });
  }
  if (!counterNftId) {
    throw new Error("Counter NFT creation didn't work");
  }

  const betAmountCoin = tx.splitCoins(tx.gas, [tx.pure("200000000")]);
  const randomBytesAsHexString = getUserRandomnessAsHexString();

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::place_bet_and_create_game`,
    arguments: [
      tx.pure(Array.from(playerPublicKey.toRawBytes()), "vector<u8>"),
      tx.pure(randomBytesAsHexString),
      tx.object(counterNftId!),
      betAmountCoin,
      tx.object(houseDataId),
    ],
  });

  return suiClient
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
      const { objectId } = createdGame;
      console.log("Created game id:", objectId);
      return objectId;
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
