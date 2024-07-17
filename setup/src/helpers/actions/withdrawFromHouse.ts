import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ADDRESS } from "../../config";
import { getKeypair } from "../keypair/getKeyPair";

interface DrawFromHouse {
  suiClient: SuiClient;
  houseDataId: string;
  adminSecretKey: string;
}

export const withdrawFromHouse = async ({
  suiClient,
  houseDataId,
  adminSecretKey,
}: DrawFromHouse) => {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::withdraw`,
    arguments: [tx.object(houseDataId)],
  });

  return suiClient
    .signAndExecuteTransaction({
      signer: getKeypair(adminSecretKey),
      transaction: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    })
    .then((resp) => {
      const status = resp?.effects?.status.status;
      if (status !== "success") {
        throw new Error("Could not withdraw from house");
      }
      console.log("Withdrawn from house successfully");
    })
    .catch((err) => {
      console.log(err);
    });
};
