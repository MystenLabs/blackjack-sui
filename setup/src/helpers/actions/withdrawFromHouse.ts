import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
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
  const tx = new TransactionBlock();

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::withdraw`,
    arguments: [tx.object(houseDataId)],
  });

  return suiClient
    .signAndExecuteTransactionBlock({
      signer: getKeypair(adminSecretKey),
      transactionBlock: tx,
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
