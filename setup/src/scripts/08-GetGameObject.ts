import { SuiClient } from "@mysten/sui/client";
import { getGameObject } from "../helpers/getObject/getGameObject";
import { GAME_ID, SUI_NETWORK } from "../config";

const getGame = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  if (!GAME_ID) {
    throw new Error("GAME_ID is not set in your .env file");
  }
  const game = await getGameObject({
    suiClient,
    gameId: GAME_ID,
  });
  console.log(game);
};

getGame();
