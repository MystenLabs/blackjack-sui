import { SuiClient } from "@mysten/sui/client";
import { createGameByPlayer } from "../helpers/actions/createGameByPlayer";
import fs from "fs";
import { BJ_PLAYER_SECRET_KEY, HOUSE_DATA_ID, SUI_NETWORK } from "../config";

if (!BJ_PLAYER_SECRET_KEY) {
  throw new Error("BJ_PLAYER_SECRET_KEY is not set in your .env file");
}

const createGame = async () => {
  const gameId = await createGameByPlayer({
    suiClient: new SuiClient({ url: SUI_NETWORK }),
    playerSecretKey: BJ_PLAYER_SECRET_KEY,
    houseDataId: HOUSE_DATA_ID,
  });
  fs.appendFileSync("./.env", `GAME_ID=${gameId}\n`);
};

createGame();
