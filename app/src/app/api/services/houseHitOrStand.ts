import { SuiClient } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";
import { getGameObject } from "../helpers/getGameObject";
import { sponsorAndSignTransaction } from "../utils/sponsorAndSignTransaction";
import { enokiClient } from "@/app/api/EnokiClient";
import { hit, stand } from "@/__generated__/blackjack/single_player_blackjack";

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

    if (move === 'hit') {
      tx.add(
        hit({
          arguments: [
            tx.object(gameId),
            tx.object(houseDataId),
            tx.object(requestObjectId),
          ],
        }),
      );
    } else {
      tx.add(
          stand({
            arguments: [
              tx.object(gameId),
              tx.object(houseDataId),
              tx.object(requestObjectId),
            ],
          }),
      );
    }

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
