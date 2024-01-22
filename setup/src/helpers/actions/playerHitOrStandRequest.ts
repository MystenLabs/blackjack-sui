import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { PACKAGE_ADDRESS } from "../../config";
import { getGameObject } from "../getObject/getGameObject";
import { formatAddress } from "@mysten/sui.js/utils";

interface DoPlayerHitProps {
  playerSecretKey: string;
  suiClient: SuiClient;
  gameId: string;
  move: "hit" | "stand";
  onSuccess?: (event: SuiEvent) => void;
}

export const doPlayerHitOrStand = async ({
  playerSecretKey,
  suiClient,
  gameId,
  move,
  onSuccess,
}: DoPlayerHitProps) => {
  const playerKeypair = getKeypair(playerSecretKey);
  const playerAddress = playerKeypair.getPublicKey().toSuiAddress();
  console.log(`Player ${formatAddress(playerAddress)} is requesting a ${move}...`);

  await getGameObject({ suiClient, gameId }).then(async (resp) => {
    const { player_sum } = resp;

    const tx = new TransactionBlock();
    tx.moveCall({
      target: `${PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
      arguments: [tx.object(gameId), tx.pure(player_sum, "u8")],
    });

    await suiClient
      .signAndExecuteTransactionBlock({
        signer: playerKeypair,
        transactionBlock: tx,
        requestType: "WaitForLocalExecution",
        options: {
          showObjectChanges: true,
          showEffects: true,
          showEvents: true,
        },
      })
      .then((resp) => {
        const status = resp?.effects?.status.status;
        if (status !== "success") {
          throw new Error("Transaction failed");
        }
        const event = resp.events?.find(
          ({ type }) =>
            type ===
            `${PACKAGE_ADDRESS}::single_player_blackjack::${
              move === "hit" ? "Hit" : "Stand"
            }RequestedEvent`
        );
        console.log({ event });
        !!onSuccess && onSuccess(event!);
      })
      .catch((err) => {
        console.log({ err });
      });
  });
};
