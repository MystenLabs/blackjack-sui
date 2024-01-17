import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ADDRESS } from "../config";
import { getKeypair } from "../helpers/getKeyPair";

interface CreateCounterObjectByPlayerProps {
  playerSecretKey: string;
  suiClient: SuiClient;
}

//TODO: add a validation that the specific player does not already own a counter object
export const createCounterObjectByPlayer = async ({
  playerSecretKey,
  suiClient,
}: CreateCounterObjectByPlayerProps): Promise<string | undefined> => {
  const playerKeypair = getKeypair(playerSecretKey);
  console.log({ playerAddress: playerKeypair.getPublicKey().toSuiAddress() });

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
      if (status !== "success") {
        throw new Error("CounterNft not created");
      }
      const createdObjects = resp.objectChanges?.filter(
        ({ type }) => type === "created"
      ) as SuiObjectChangeCreated[];
      const createdCounterNft = createdObjects.find(({ objectType }) =>
        objectType.endsWith("counter_nft::Counter")
      );
      if (!createdCounterNft) {
        throw new Error("CounterNft not created");
      }
      console.log({ createdCounterNftId: createdCounterNft.objectId });
      return createdCounterNft.objectId;
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
