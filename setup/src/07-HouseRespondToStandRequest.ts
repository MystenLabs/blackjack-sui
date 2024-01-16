import { SuiClient } from "@mysten/sui.js/client";
import { GAME_ID, SUI_NETWORK } from "./config";
import { getGameObject } from "./helpers/getGameObject";
import { houseHitOrStand } from "./scenarios/houseHitOrStand";

const houseExecuteStand = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  const game = await getGameObject({
    suiClient,
    gameId: GAME_ID,
  });
  const { fields } = game as any;
  await houseHitOrStand({
    eventParsedJson: {
      current_player_hand_sum: fields.player_sum,
      gameId: GAME_ID,
    },
    move: "stand",
  });
};

houseExecuteStand();
