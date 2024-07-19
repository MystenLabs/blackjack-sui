import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ADDRESS } from "../../config";
import { getKeypair } from "../keypair/getKeyPair";

interface CreateCounterObjectByPlayerProps {
  playerSecretKey: string;
  suiClient: SuiClient;
}

export const createCounterObjectByPlayer = async ({
  playerSecretKey,
  suiClient,
}: CreateCounterObjectByPlayerProps): Promise<string | undefined> => {
  const playerKeypair = getKeypair(playerSecretKey);

  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::counter_nft::mint_and_transfer`,
    arguments: [],
  });

  return suiClient
    .signAndExecuteTransaction({
      signer: playerKeypair,
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
