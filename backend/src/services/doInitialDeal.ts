import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex } from "@noble/hashes/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getKeypair } from "../helpers/getKeyPair";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { ADMIN_SECRET_KEY, PACKAGE_ADDRESS } from "../utils/config";
import { getGameObject } from "../helpers/getGameObject";
import { logger } from "../utils/logger";

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
  logger.info(`Doing initial deal for game: ${gameId}`);

  const adminKeypair = getKeypair(ADMIN_SECRET_KEY!);

  const tx = new TransactionBlock();
  await getGameObject({ suiClient, gameId })
    .then(async (resp) => {
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
        target: `${PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
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
          },
        })
        .then(async (res) => {
          const status = res?.effects?.status.status;
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
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
