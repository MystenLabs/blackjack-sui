import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { BJ_PLAYER_SECRET_KEY, PACKAGE_ADDRESS, SUI_NETWORK } from "../config";
import { getKeypair } from "../helpers/getKeyPair";

const suiClient = new SuiClient({
  url: SUI_NETWORK,
});
const playerKeypair = getKeypair(BJ_PLAYER_SECRET_KEY!);

console.log("Player Address =  ", playerKeypair.getPublicKey().toSuiAddress());

//TODO: add a validation that the specific player does not already own a counter object
export const createCounterObjectByPlayer = async (): Promise<string | void> => {
  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::counter_nft::mint_and_transfer`,
    arguments: [],
  });
  tx.setGasBudget(1000000000);

  return suiClient
    .signAndExecuteTransactionBlock({
      signer: playerKeypair,
      transactionBlock: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showObjectChanges: true,
        showEffects: true,
      },
    })
    .then((resp) => {
      const status = resp?.effects?.status.status;
      console.log("executed! status = ", status);
      if (status !== "success") {
        throw new Error("CounterNft not created");
      }
      const createdCounterNft = resp.objectChanges?.find(
        ({ type, objectType }: any) =>
          type === "created" && objectType.endsWith("counter_nft::Counter")
      );
      if (!createdCounterNft) {
        throw new Error("CounterNft not created");
      }
      console.log({ counterNftId: (createdCounterNft as any).objectId });
    })
    .catch((err) => {
      console.log(err);
    });
};
