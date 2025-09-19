import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { getGameObject } from "../helpers/getGameObject";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";
import { enokiClient } from "@/app/api/EnokiClient";
import { firstDeal } from "@/__generated__/blackjack/single_player_blackjack";

interface DoInitialDealProps {
  suiClient: SuiClient;
  gameId: string;
}

// Not catching errors on purpose, they will be caught and logged by the corresponding route.ts file
export const doInitialDeal = async ({
  suiClient,
  gameId,
}: DoInitialDealProps): Promise<{ txDigest: string }> => {
  console.log("Doing initial deal as the house...");

  const tx = new Transaction();
  return getGameObject({ suiClient, gameId })
    .then(async () => {
      tx.add(
        firstDeal({
          arguments: [
            tx.object(gameId),
          ],
        }),
      );

      const { signedTransaction, sponsoredTransaction } =
        await sponsorAndSignTransaction({
          tx,
          suiClient,
        });

      const result = await enokiClient.executeSponsoredTransaction({
        signature: signedTransaction.signature,
        digest: sponsoredTransaction.digest,
      });

      return suiClient
        .waitForTransaction({
          digest: result.digest,
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
