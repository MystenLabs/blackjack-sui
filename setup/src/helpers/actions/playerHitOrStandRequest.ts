import {
  SuiClient,
  SuiEvent,
  SuiObjectChange,
  SuiObjectChangeCreated,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getGameObject } from "../getObject/getGameObject";
import { formatAddress } from "@mysten/sui/utils";
import { getAddress } from "../keypair/getAddress";

interface DoPlayerHitProps {
  playerSecretKey: string;
  suiClient: SuiClient;
  gameId: string;
  move: "hit" | "stand";
}

export const doPlayerHitOrStand = async ({
  playerSecretKey,
  suiClient,
  gameId,
  move,
}: DoPlayerHitProps) => {
  const playerKeypair = getKeypair(playerSecretKey);
  const playerAddress = playerKeypair.getPublicKey().toSuiAddress();
  console.log(
    `Player ${formatAddress(playerAddress)} is requesting a ${move}...`
  );

  await getGameObject({ suiClient, gameId }).then(async (resp) => {
    const { player_sum } = resp;

    const tx = new Transaction();
    let request = tx.moveCall({
      target: `${PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
      arguments: [tx.object(gameId), tx.pure.u8(player_sum)],
    });
    tx.transferObjects([request], getAddress(ADMIN_SECRET_KEY));

    await suiClient
      .signAndExecuteTransaction({
        signer: playerKeypair,
        transaction: tx,
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
        const createdObjects = resp.objectChanges?.filter(
          ({ type }) => type === "created"
        ) as SuiObjectChangeCreated[];
        const hitOrStandRequest = createdObjects.find(
          ({ objectType }) =>
            objectType ===
            `${PACKAGE_ADDRESS}::single_player_blackjack::${move
              .slice(0, 1)
              .toUpperCase()
              .concat(move.slice(1))}Request`
        );
        if (!hitOrStandRequest) {
          throw new Error(
            `No ${move}Request found in the admin's owned objects`
          );
        }
        console.log({
          [`${move}RequestId`]: hitOrStandRequest?.objectId,
        });
      })
      .catch((err) => {
        console.log({ err });
      });
  });
};
