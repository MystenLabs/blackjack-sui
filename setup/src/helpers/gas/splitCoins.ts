import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getAddress } from "../keypair/getAddress";
import { getKeypair } from "../keypair/getKeyPair";

interface SplitCoinsProps {
  coinsNum: number;
  coinBalance: number;
  secretKey: string;
  suiClient: SuiClient;
}

export const splitCoins = async ({
  coinsNum,
  coinBalance,
  secretKey,
  suiClient,
}: SplitCoinsProps) => {
  const keypair = getKeypair(secretKey);
  const address = getAddress(secretKey);
  const tx = new TransactionBlock();

  for (let i = 0; i < coinsNum; i++) {
    let coin = tx.splitCoins(tx.gas, [tx.pure(coinBalance)]);
    tx.transferObjects([coin], tx.pure(address));
  }

  await suiClient
    .signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: keypair,
      options: {
        showObjectChanges: true,
      },
    })
    .then((resp) => {
      const createdObjects = resp.objectChanges?.filter(
        ({ type }) => type === "created"
      ) as SuiObjectChangeCreated[];
      const createdCoins = createdObjects.filter(
        ({ objectType }) => objectType === "0x2::coin::Coin<0x2::sui::SUI>"
      );
      console.log("Created coins: ", createdCoins.length);
    })
    .catch((err) => {
      console.log(err);
    });
};
