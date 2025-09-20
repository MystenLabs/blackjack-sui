import { SuiClient, SuiEvent } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { getGameObject } from "../getObject/getGameObject";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getHitOrStandRequestForGameAndSum } from "../getObject/getHitOrStandRequestForGameAndSum";

interface HouseHitOrStandProps {
  gameId: string;
  move: "hit" | "stand";
  suiClient: SuiClient;
  houseDataId: string;
  requestObjectId?: string;
  onHitSuccess?: (event: SuiEvent) => void;
  onStandSuccess?: (gameId: string) => void;
}

export const houseHitOrStand = async ({
  gameId,
  move,
  suiClient,
  houseDataId,
  requestObjectId,
  onHitSuccess,
  onStandSuccess,
}: HouseHitOrStandProps) => {
  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);

  console.log(
    `House is ${
      move === "hit" ? "hitting" : "standing"
    } for game ${formatAddress(gameId)}...`
  );

  try {
    const resp = await getGameObject({ suiClient, gameId });
    const tx = new Transaction();

    let hitOrStandRequest = requestObjectId || await getHitOrStandRequestForGameAndSum({
      move,
      gameId,
      playerSum: resp.player_sum,
      suiClient,
    });

    if (!hitOrStandRequest) {
      throw new Error("No hit or stand request found for this move in the admin's owned objects");
    }

    console.log({ hitOrStandRequest });

    // Use on-chain randomness instead of BLS signature
    tx.moveCall({
      target: `${PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
      arguments: [
        tx.object(gameId),
        tx.object(houseDataId),
        tx.object(hitOrStandRequest),
        tx.object("0x8"), // Random object at 0x8
      ],
    });

    const txResp = await suiClient.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
        showEvents: true,
      },
    });

    const status = txResp?.effects?.status.status;
    console.log({ status });
    if (status !== "success") {
      throw new Error("Transaction failed");
    }

    if (move === "hit") {
      const event = txResp.events?.find(
        ({ type }) =>
          type ===
          `${PACKAGE_ADDRESS}::single_player_blackjack::HitDoneEvent`
      );
      if (onHitSuccess && event) {
        onHitSuccess(event);
      }
    } else {
      if (onStandSuccess) {
        onStandSuccess(gameId);
      }
    }
  } catch (err) {
    console.log({ err });
  }
};
