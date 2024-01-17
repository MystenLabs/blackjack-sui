import { SuiClient } from "@mysten/sui.js/client";
import { getGameObject } from "./helpers/getGameObject";
import { GAME_ID, SUI_NETWORK } from "./config";

const getGame = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  const game = await getGameObject({
    suiClient,
    gameId: GAME_ID,
  });
  console.log(game);
};

getGame();
