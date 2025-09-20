import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { generateCards } from "../cards/generateCards";
import { getGameObject } from "../getObject/getGameObject";
import { getPlayerHand } from "../cards/getPlayerHand";
import {
  PACKAGE_ADDRESS,
  ADMIN_SECRET_KEY,
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

  const tx = new Transaction();

  // Use on-chain randomness instead of BLS signature
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
    arguments: [
      tx.object(gameId),
      tx.object("0x8"), // Random object at 0x8
    ],
  });

  try {
    const res = await suiClient.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    });

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

    if (onSuccess) {
      onSuccess(gameId);
    }
  } catch (err) {
    console.log({ err });
  }
};
