import { SuiClient, SuiEvent } from "@mysten/sui.js/client";
import { formatAddress } from "@mysten/sui.js/utils";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getKeypair } from "../helpers/getKeyPair";
import { getGameObject } from "../helpers/getGameObject";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";

interface HouseHitOrStandProps {
  gameId: string;
  move: "hit" | "stand";
  suiClient: SuiClient;
  houseDataId: string;
  requestObjectId: string;
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
  const adminKeypair = getKeypair(process.env.ADMIN_SECRET_KEY!);

  console.log(
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
        getBLSSecreyKey(process.env.ADMIN_SECRET_KEY!)
      );

      tx.setGasBudget(10000000000);
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
        arguments: [
          tx.object(gameId),
          tx.pure(Array.from(signedHouseHash), "vector<u8>"),
          tx.object(houseDataId),
          tx.object(requestObjectId),
        ],
      });

      const { signedTransaction, sponsoredTransaction } =
        await sponsorAndSignTransaction({
          tx,
          suiClient,
        });

      await suiClient
        .executeTransactionBlock({
          transactionBlock: signedTransaction.bytes,
          signature: [
            signedTransaction.signature,
            sponsoredTransaction.signature,
          ],
          requestType: "WaitForLocalExecution",
          options: {
            showObjectChanges: true,
            showEffects: true,
            showEvents: true,
          },
        })
        .then((resp) => {
          const status = resp?.effects?.status.status;
          console.log(`status: ${status}`);
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
          if (move === "hit") {
            const event = resp.events?.find(
              ({ type }) =>
                type ===
                `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!}::single_player_blackjack::HitDoneEvent`
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
