import { SuiClient } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { bytesToHex } from "@noble/curves/abstract/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getGameObject } from "../helpers/getGameObject";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";
import { bcs } from "@mysten/sui/bcs";

interface HouseHitOrStandProps {
  gameId: string;
  move: "hit" | "stand";
  suiClient: SuiClient;
  houseDataId: string;
  requestObjectId: string;
}

// Not catching errors on puprose, they will be caught and logged by the corresponding route.ts file
export const houseHitOrStand = async ({
  gameId,
  move,
  suiClient,
  houseDataId,
  requestObjectId,
}: HouseHitOrStandProps) => {
  console.log(
    `House is ${
      move === "hit" ? "hitting" : "standing"
    } for game ${formatAddress(gameId)}...`
  );

  return getGameObject({ suiClient, gameId }).then(async (resp) => {
    const tx = new Transaction();
    const { counter, user_randomness } = resp;
    const counterHex = bytesToHex(Uint8Array.from([counter]));
    const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
    const messageToSign = randomnessHexString.concat(counterHex);
    let signedHouseHash = bls12_381.sign(
      messageToSign,
      getBLSSecreyKey(process.env.ADMIN_SECRET_KEY!)
    );

    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::${move}`,
      arguments: [
        tx.object(gameId),
        tx.pure(bcs.vector(bcs.u8()).serialize(signedHouseHash)),
        tx.object(houseDataId),
        tx.object(requestObjectId),
      ],
    });

    const { signedTransaction, sponsoredTransaction } =
      await sponsorAndSignTransaction({
        tx,
        suiClient,
      });

    return suiClient
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
        return {
          txDigest: resp.effects?.transactionDigest!,
        };
      });
  });
};
