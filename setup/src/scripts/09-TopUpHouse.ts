import { SuiClient } from "@mysten/sui/client";
import { SUI_NETWORK, ADMIN_SECRET_KEY, HOUSE_DATA_ID } from "../config";
import { topUpHouseData } from "../helpers/actions/topUpHouse";

const houseTopUp = async () => {
  const suiClient = new SuiClient({ url: SUI_NETWORK });
  await topUpHouseData({
    adminSecretKey: ADMIN_SECRET_KEY,
    houseDataId: HOUSE_DATA_ID,
    suiClient,
  });
};

houseTopUp();
