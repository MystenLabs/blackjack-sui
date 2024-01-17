import { SuiClient, SuiMoveObject } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../helpers/getKeyPair";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { bls12_381 } from "@noble/curves/bls12-381";

import {
  PACKAGE_ADDRESS,
  SUI_NETWORK,
  ADMIN_SECRET_KEY,
  HOUSE_DATA_ID,
  deriveBLS_SecretKey,
} from "../config";
import { generateCards } from "../helpers/cards/generateCards";
import { getGameObject } from "../helpers/getGameObject";
import { getPlayerHand } from "../helpers/cards/getPlayerHand";
import { GameOnChain } from "../types/GameOnChain";

interface DoInitialDealProps {
  gameId: string;
  houseDataId: string;
  onSuccess?: (gameId: string) => void;
}

export const doInitialDeal = async ({
  gameId,
  houseDataId,
  onSuccess,
}: DoInitialDealProps) => {
  console.log("Doing initial deal as the house...");
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);

  console.log("Connecting to SUI network: ", SUI_NETWORK);
  console.log("GAME_ID: ", gameId);
  console.log("HOUSE_DATA_ID: ", houseDataId);
  console.log("Signer Address: ", adminKeypair.getPublicKey().toSuiAddress());

  const cards = generateCards();
  const tx = new TransactionBlock();

  await suiClient
    .getObject({
      id: gameId,
      options: { showContent: true },
    })
    .then(async (res) => {
      const gameObject = res?.data?.content as SuiMoveObject;
      const { counter, user_randomness } =
        gameObject.fields as unknown as GameOnChain;

      const counterHex = bytesToHex(Uint8Array.from([counter]));
      const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));

      const messageToSign = randomnessHexString.concat(counterHex);

      let signedHouseHash = bls12_381.sign(
        messageToSign,
        deriveBLS_SecretKey(ADMIN_SECRET_KEY!)
      );

      console.log("randomness = ", user_randomness);
      console.log("counter = ", counterHex);
      console.log(
        "Full MessageTo Sign Bytes = ",
        hexToBytes(randomnessHexString)
      );

      tx.setGasBudget(10000000000);

      tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
        arguments: [
          tx.object(gameId),
          tx.pure(Array.from(signedHouseHash), "vector<u8>"),
          tx.object(HOUSE_DATA_ID),
        ],
      });

      await suiClient
        .signAndExecuteTransactionBlock({
          signer: adminKeypair,
          transactionBlock: tx,
          requestType: "WaitForLocalExecution",
          options: {
            showObjectChanges: true,
            showEffects: true,
          },
        })
        .then(async (res) => {
          const status = res?.effects?.status.status;
          console.log("executed! status = ", status);
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
          const { player_cards: playerCards } = await getGameObject({
            suiClient,
            gameId,
          });
          console.log(playerCards);
          const playerHand = getPlayerHand({ cardsMap: cards, playerCards });
          console.log("Player Hand = ", playerHand);
          !!onSuccess && onSuccess(gameId);
        })
        .catch((err) => {
          console.log("Error = ", err);
        });
    });
};
