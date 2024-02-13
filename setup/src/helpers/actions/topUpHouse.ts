import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ADDRESS } from "../../config";
import { getKeypair } from "../keypair/getKeyPair";

interface TopUpHouseDataProps {
  adminSecretKey: string;
  suiClient: SuiClient;
  houseDataId: string;
}

export const topUpHouseData = async ({
  adminSecretKey,
  houseDataId,
  suiClient,
}: TopUpHouseDataProps) => {
  const tx = new TransactionBlock();

  const coin = tx.splitCoins(tx.gas, [tx.pure(1000_000_000_000)]);
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::top_up`,
    arguments: [tx.object(houseDataId), coin],
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
        throw new Error("HouseData not topped up");
      }
      console.log("HouseData topped up successfully");
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
