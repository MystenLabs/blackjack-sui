import { SuiClient, SuiEvent, SuiMoveObject } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../helpers/getKeyPair";
import { PACKAGE_ADDRESS, SUI_NETWORK, BJ_PLAYER_SECRET_KEY } from "../config";

interface DoPlayerHitProps {
  gameId: string;
  move: "hit" | "stand";
  onSuccess?: (event: SuiEvent) => void;
}

export const doPlayerHitOrStand = async ({
  gameId,
  move,
  onSuccess,
}: DoPlayerHitProps) => {
  const playerKeypair = getKeypair(BJ_PLAYER_SECRET_KEY!);
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });

  console.log("Connecting to SUI network: ", SUI_NETWORK);
  console.log(
    "Player Address =  ",
    playerKeypair.getPublicKey().toSuiAddress()
  );

  await suiClient
    .getObject({
      id: gameId,
      options: { showContent: true },
    })
    .then(async (res) => {
      const gameObject = res?.data?.content as SuiMoveObject;
      const { fields } = gameObject as any;

      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
        arguments: [tx.object(gameId), tx.pure(fields.player_sum, "u8")],
      });

      suiClient
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
          console.log("executed! status = ", status);

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
          console.log("Error = ", err);
        });
    });
};
