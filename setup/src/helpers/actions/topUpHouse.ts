import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { PACKAGE_ADDRESS } from "../../config";
import { getKeypair } from "../keypair/getKeyPair";
import { MIST_PER_SUI } from "@mysten/sui/utils";

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
  const tx = new Transaction();

  // 1000 sui needed for initial house setup
  // if this is not possible, adjust the number of sui needed here
  const coin = tx.splitCoins(tx.gas, [tx.pure.u64(1000 * Number(MIST_PER_SUI))]);
  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::top_up`,
    arguments: [tx.object(houseDataId), coin],
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
        throw new Error("HouseData not topped up");
      }
      console.log("HouseData topped up successfully");
    })
    .catch((err) => {
      console.log(err);
      return undefined;
    });
};
