import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bytesToHex } from "@noble/hashes/utils";
import { bls12_381 } from "@noble/curves/bls12-381";
import { getBLSSecreyKey } from "../helpers/getBLSSecretKey";
import { getGameObject } from "../helpers/getGameObject";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";

interface DoInitialDealProps {
  suiClient: SuiClient;
  gameId: string;
  houseDataId: string;
}

export const doInitialDeal = async ({
  suiClient,
  gameId,
  houseDataId,
}: DoInitialDealProps) => {
  console.log(`Doing initial deal for game: ${gameId}`);

  const tx = new TransactionBlock();
  await getGameObject({ suiClient, gameId })
    .then(async (resp) => {
      const { counter, user_randomness } = resp;
      console.log({ counter, user_randomness });
      const counterHex = bytesToHex(Uint8Array.from([counter]));
      console.log({ counterHex });
      const randomnessHexString = bytesToHex(Uint8Array.from(user_randomness));
      console.log({ randomnessHexString });
      const messageToSign = randomnessHexString.concat(counterHex);
      console.log({ messageToSign });
      let signedHouseHash = bls12_381.sign(
        messageToSign,
        getBLSSecreyKey(process.env.ADMIN_SECRET_KEY!)
      );
      console.log({ signedHouseHash });
      tx.setGasBudget(10000000000);
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ADDRESS}::single_player_blackjack::first_deal`,
        arguments: [
          tx.object(gameId),
          tx.pure(Array.from(signedHouseHash), "vector<u8>"),
          tx.object(houseDataId),
        ],
      });
      console.log({ tx });

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
          },
        })
        .then(async (res) => {
          const status = res?.effects?.status.status;
          if (status !== "success") {
            throw new Error("Transaction failed");
          }
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Transaction failed");
        });
    })
    .catch((err) => {
      console.log(err);
      throw new Error("Game object does not exist on chain.");
    });
};
