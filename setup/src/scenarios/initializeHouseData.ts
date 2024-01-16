import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import fs from "fs";
import { getKeypair } from "../helpers/getKeyPair";
import { getBLSPublicKey } from "../helpers/bls/getBLSPublicKey";
import {
  PACKAGE_ADDRESS,
  HOUSE_ADMIN_CAP,
  SUI_NETWORK,
  ADMIN_SECRET_KEY,
} from "../config";

const suiClient = new SuiClient({
  url: SUI_NETWORK,
});
const initHouseBalance = 10000000000;

export const initializeHouseData = async () => {
  const tx = new TransactionBlock();

  const houseCoin = tx.splitCoins(tx.gas, [tx.pure(initHouseBalance)]);
  let adminBLSPublicKey = getBLSPublicKey(ADMIN_SECRET_KEY!);

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::initialize_house_data`,
    arguments: [
      tx.object(HOUSE_ADMIN_CAP),
      houseCoin,
      tx.pure(Array.from(adminBLSPublicKey)),
    ],
  });

  suiClient
    .signAndExecuteTransactionBlock({
      signer: getKeypair(ADMIN_SECRET_KEY!),
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
        fs.writeFileSync("./tx_res.json", JSON.stringify(resp));
        throw new Error("HouseData not created");
      }
      if (status === "success") {
        const createdHouseData = resp.objectChanges?.find(
          ({ type, objectType }: any) =>
            type === "created" &&
            objectType.endsWith("single_player_blackjack::HouseData")
        );
        if (!createdHouseData) {
          throw new Error("HouseData not created");
        }
        const { objectId } = createdHouseData as any;
        console.log({ houseDataId: objectId });
        const houseDataEnvString = `HOUSE_DATA_ID=${objectId}\n`;
        const appHouseDataEnvString = `NEXT_PUBLIC_HOUSE_DATA_ID=${objectId}\n`;

        fs.writeFileSync("./tx_res.json", JSON.stringify(resp));
        fs.appendFileSync("./.env", houseDataEnvString);
        fs.appendFileSync("../app/.env", appHouseDataEnvString);
      }
    })
    .catch((err) => {
      console.error("Error = ", err);
    });
};
