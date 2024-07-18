import { SuiClient } from "@mysten/sui/client";
import { initializeHouseData } from "../helpers/actions/initializeHouseData";
import fs from "fs";
import { SUI_NETWORK } from "../config";

const initializeHouse = async () => {
  const houseDataId = await initializeHouseData({
    suiClient: new SuiClient({ url: SUI_NETWORK }),
  });
  fs.appendFileSync("./.env", `HOUSE_DATA_ID=${houseDataId}\n`);
  fs.appendFileSync(
    "../app/.env",
    `NEXT_PUBLIC_HOUSE_DATA_ID=${houseDataId}\n`
  );
};

initializeHouse();
