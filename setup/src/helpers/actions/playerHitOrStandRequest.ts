import {
  SuiClient,
  SuiEvent,
  SuiObjectChange,
  SuiObjectChangeCreated,
} from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getGameObject } from "../getObject/getGameObject";
import { formatAddress } from "@mysten/sui.js/utils";
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

  return getGameObject({ suiClient, gameId }).then(async (resp) => {
    const { player_sum } = resp;

    const tx = new TransactionBlock();
    let request = tx.moveCall({
      target: `${PACKAGE_ADDRESS}::single_player_blackjack::do_${move}`,
      arguments: [tx.object(gameId), tx.pure(player_sum, "u8")],
    });
    tx.transferObjects([request], getAddress(ADMIN_SECRET_KEY));

    return suiClient
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
        return hitOrStandRequest?.objectId;
      })
      .catch((err) => {
        console.log({ err });
      });
  });
};
