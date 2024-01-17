import { SuiClient, SuiObjectChangeCreated } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getKeypair } from "../helpers/getKeyPair";
import { getBLSPublicKey } from "../helpers/bls/getBLSPublicKey";
import { PACKAGE_ADDRESS, HOUSE_ADMIN_CAP, ADMIN_SECRET_KEY } from "../config";

interface InitializeHouseBalanceProps {
  suiClient: SuiClient;
}

export const initializeHouseData = async ({
  suiClient,
}: InitializeHouseBalanceProps): Promise<string | undefined> => {
  const tx = new TransactionBlock();

  const houseCoin = tx.splitCoins(tx.gas, [tx.pure(10000000000)]);
  let adminBLSPublicKey = getBLSPublicKey(ADMIN_SECRET_KEY!);

  tx.moveCall({
    target: `${PACKAGE_ADDRESS}::single_player_blackjack::initialize_house_data`,
    arguments: [
      tx.object(HOUSE_ADMIN_CAP),
      houseCoin,
      tx.pure(Array.from(adminBLSPublicKey)),
    ],
  });

  return suiClient
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
        throw new Error("HouseData not created");
      }
      if (status === "success") {
        const createdObjects = resp.objectChanges?.filter(
          ({ type }) => type === "created"
        ) as SuiObjectChangeCreated[];
        const createdHouseData = createdObjects.find(({ objectType }) =>
          objectType.endsWith("single_player_blackjack::HouseData")
        );
        if (!createdHouseData) {
          throw new Error("HouseData not created");
        }
        const { objectId: houseDataId } = createdHouseData;
        console.log({ houseDataId });
        return houseDataId;
      }
    })
    .catch((err) => {
      console.error("Error = ", err);
      return undefined;
    });
};
