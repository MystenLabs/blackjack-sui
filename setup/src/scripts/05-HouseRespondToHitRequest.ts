import { SuiClient } from "@mysten/sui/client";
import { GAME_ID, HOUSE_DATA_ID, SUI_NETWORK } from "../config";
import { houseHitOrStand } from "../helpers/actions/houseHitOrStand";

const houseExecuteHit = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  await houseHitOrStand({
    gameId: GAME_ID,
    move: "hit",
    suiClient,
    houseDataId: HOUSE_DATA_ID,
  });
};

houseExecuteHit();
