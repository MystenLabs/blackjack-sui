import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getKeypair } from "../helpers/getKeyPair";
import { bytesToHex } from "@noble/hashes/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { getGameObject } from "../helpers/getGameObject";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";
import { bcs } from "@mysten/sui/bcs";

interface DoInitialDealProps {
  suiClient: SuiClient;
  gameId: string;
  houseDataId: string;
}

// Not catching errors on purpose, they will be caught and logged by the corresponding route.ts file
export const doInitialDeal = async ({
  suiClient,
  gameId,
  houseDataId,
}: DoInitialDealProps): Promise<{ txDigest: string }> => {
  console.log("Doing initial deal as the house...");

  const adminKeypair = getKeypair(process.env.ADMIN_SECRET_KEY!);

  const tx = new Transaction();
  return getGameObject({ suiClient, gameId }).then(async (resp) => {
    const { counter, user_randomness } = resp;
    const counterHex = bytesToHex(Uint8Array.from([counter]));
    const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
    const messageToSign = randomnessHexString.concat(counterHex);
    let signedHouseHash = bls12_381.sign(
      messageToSign,
      getBLSSecreyKey(process.env.ADMIN_SECRET_KEY!)
    );

    console.log({
      package: process.env.NEXT_PUBLIC_PACKAGE_ADDRESS,
      gameId,
      signedHouseHash,
      houseDataId,
    });

    tx.moveCall({
      target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
      arguments: [
        tx.object(gameId),
        tx.pure(bcs.vector(bcs.u8()).serialize(signedHouseHash)),
        tx.object(houseDataId),
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
        },
      })
      .then(async (res) => {
        const status = res?.effects?.status.status;
        if (status !== "success") {
          throw new Error("Transaction failed");
        }
        return { txDigest: res.effects?.transactionDigest! };
      });
  });
};
