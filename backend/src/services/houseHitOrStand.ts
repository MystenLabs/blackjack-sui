import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { formatAddress } from "@mysten/sui.js/utils";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getKeypair } from "../helpers/getKeyPair";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../utils/config";
import { getGameObject } from "../helpers/getGameObject";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { logger } from "../utils/logger";

interface HouseHitOrStandProps {
  gameId: string;
  move: "hit" | "stand";
  suiClient: SuiClient;
  houseDataId: string;
  onHitSuccess?: (event: SuiEvent) => void;
  onStandSuccess?: (gameId: string) => void;
}

export const houseHitOrStand = async ({
  gameId,
  move,
  suiClient,
  houseDataId,
  onHitSuccess,
  onStandSuccess,
}: HouseHitOrStandProps) => {
  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);

  logger.info(
    `House is ${
      move === "hit" ? "hitting" : "standing"
    } for game ${formatAddress(gameId)}...`
  );

  await getGameObject({ suiClient, gameId })
    .then(async (resp) => {
      const tx = new TransactionBlock();
      const { counter, user_randomness } = resp;
      const counterHex = bytesToHex(Uint8Array.from([counter]));
      const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
      const messageToSign = randomnessHexString.concat(counterHex);
      let signedHouseHash = bls12_381.sign(
        messageToSign,
        getBLSSecreyKey(ADMIN_SECRET_KEY!)
      );

      tx.setGasBudget(10000000000);
      tx.moveCall({
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
        arguments: [
          tx.object(gameId),
          tx.pure(Array.from(signedHouseHash), "vector<u8>"),
          tx.object(houseDataId),
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
            showEvents: true,
          },
        })
        .then((resp) => {
          const status = resp?.effects?.status.status;
          logger.info(`status: ${status}`);
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
          logger.error({ err });
        });
    })
    .catch((err) => {
      logger.error({ err });
    });
};
