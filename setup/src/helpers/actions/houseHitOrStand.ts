import { SuiClient, SuiEvent } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getGameObject } from "../getObject/getGameObject";
import { getKeypair } from "../keypair/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../../config";
import { getBLSSecreyKey } from "../bls/getBLSSecretKey";
import { getHitOrStandRequestForGameAndSum } from "../getObject/getHitOrStandRequestForGameAndSum";
import { bcs } from "@mysten/sui/bcs";

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

  await getGameObject({ suiClient, gameId })
    .then(async (resp) => {
      const tx = new Transaction();
      const { counter, user_randomness } = resp;
      const counterHex = bytesToHex(Uint8Array.from([counter]));
      const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
      const messageToSign = randomnessHexString.concat(counterHex);
      let signedHouseHash = bls12_381.sign(
        messageToSign,
        getBLSSecreyKey(ADMIN_SECRET_KEY!)
      );

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

      tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
        arguments: [
          tx.object(gameId),
          tx.pure(bcs.vector(bcs.u8()).serialize(signedHouseHash)),
          tx.object(houseDataId),
          tx.object(hitOrStandRequest),
        ],
      });

      await suiClient
        .signAndExecuteTransaction({
          signer: adminKeypair,
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
          console.log({ status });
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
          if (move === "hit") {
            const event = resp.events?.find(
              ({ type }) =>
                type ===
                `${PACKAGE_ADDRESS}::single_player_blackjack::HitDoneEvent`
            );
            !!onHitSuccess && onHitSuccess(event!);
          } else {
            !!onStandSuccess && onStandSuccess(gameId);
          }
        })
        .catch((err) => {
          console.log({ err });
        });
    })
    .catch((err) => {
      console.log({ err });
    });
};
