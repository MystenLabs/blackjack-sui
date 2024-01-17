import { SuiClient } from "@mysten/sui.js/client";
import { GAME_ID, HOUSE_DATA_ID, SUI_NETWORK } from "../config";
import { getGameObject } from "../helpers/getObject/getGameObject";
import { houseHitOrStand } from "../helpers/actions/houseHitOrStand";

const houseExecuteStand = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  const { player_sum } = await getGameObject({
    suiClient,
    gameId: GAME_ID,
  });
  await houseHitOrStand({
    eventParsedJson: {
      current_player_hand_sum: player_sum,
      gameId: GAME_ID,
    },
    move: "stand",
    suiClient,
    houseDataId: HOUSE_DATA_ID,
  });
};

houseExecuteStand();
