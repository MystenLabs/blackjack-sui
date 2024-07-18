import { SuiClient } from "@mysten/sui/client";
import { ADMIN_SECRET_KEY, HOUSE_DATA_ID, SUI_NETWORK } from "../config";
import { withdrawFromHouse } from "../helpers/actions/withdrawFromHouse";

const withdrawHouse = async () => {
  const suiClient = new SuiClient({ url: SUI_NETWORK });
  await withdrawFromHouse({
    suiClient,
    houseDataId: HOUSE_DATA_ID,
    adminSecretKey: ADMIN_SECRET_KEY,
  });
};

withdrawHouse();
