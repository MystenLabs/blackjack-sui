import { splitCoins } from "../helpers/gas/splitCoins";
import { SuiClient } from "@mysten/sui.js/client";
import { ADMIN_SECRET_KEY, SUI_NETWORK } from "../config";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";

// This function prepares the gas coins of the house
// So that multiple concurrent transactions can be executed without gas coin equivocation
// Average gas cost of a single transaction is 0.002 SUI => let's split to coins of 0.02 SUI
export const prepareHouseGas = () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });

  splitCoins({
    suiClient,
    coinsNum: 500,
    coinBalance: 0.02 * Number(MIST_PER_SUI),
    secretKey: ADMIN_SECRET_KEY,
  });
};

prepareHouseGas();