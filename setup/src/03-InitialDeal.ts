import { SuiClient } from "@mysten/sui.js/client";
import { doInitialDeal } from "./scenarios/doinitialDeal";
import { GAME_ID, HOUSE_DATA_ID, SUI_NETWORK } from "./config";

if (!GAME_ID) {
  throw new Error("GAME_ID is not set in your .env file");
}

doInitialDeal({
  suiClient: new SuiClient({ url: SUI_NETWORK }),
  gameId: GAME_ID,
  houseDataId: HOUSE_DATA_ID!,
});
