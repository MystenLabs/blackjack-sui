import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { bytesToHex } from "@noble/hashes/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { generateCards } from "../cards/generateCards";
import { getGameObject } from "../getObject/getGameObject";
import { getPlayerHand } from "../cards/getPlayerHand";
import {
  PACKAGE_ADDRESS,
  ADMIN_SECRET_KEY,
  HOUSE_DATA_ID,
  deriveBLS_SecretKey,
} from "../../config";


interface DoInitialDealProps {
  suiClient: SuiClient;
  gameId: string;
  houseDataId: string;
  onSuccess?: (gameId: string) => void;
}

export const doInitialDeal = async ({
  suiClient,
  gameId,
  houseDataId,
  onSuccess,
}: DoInitialDealProps) => {
  console.log("Doing initial deal as the house...");

  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);
  const cards = generateCards();

  const tx = new TransactionBlock();
  await getGameObject({ suiClient, gameId })
    .then(async (resp) => {
      const { counter, user_randomness } = resp;
      const counterHex = bytesToHex(Uint8Array.from([counter]));
      const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
      const messageToSign = randomnessHexString.concat(counterHex);
      let signedHouseHash = bls12_381.sign(
        messageToSign,
        deriveBLS_SecretKey(ADMIN_SECRET_KEY!)
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
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
          const { player_cards: playerCards } = await getGameObject({
            suiClient,
            gameId,
          });
          const playerHand = getPlayerHand({ cardsMap: cards, playerCards });
          console.log({ playerCards, playerHand });
          !!onSuccess && onSuccess(gameId);
        })
        .catch((err) => {
          console.log({ err });
        });
    })
    .catch((err) => {
      console.log({ err });
    });
};
