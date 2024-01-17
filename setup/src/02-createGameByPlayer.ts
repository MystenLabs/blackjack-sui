import { SuiClient } from "@mysten/sui.js/client";
import { createGameByPlayer } from "./helpers/scenarios/createGameByPlayer";
import fs from "fs";
import { BJ_PLAYER_SECRET_KEY, SUI_NETWORK } from "./config";

if (!BJ_PLAYER_SECRET_KEY) {
  throw new Error("BJ_PLAYER_SECRET_KEY is not set in your .env file");
}

const createGame = async () => {
  const gameId = await createGameByPlayer({
    suiClient: new SuiClient({ url: SUI_NETWORK }),
    playerSecretKey: BJ_PLAYER_SECRET_KEY,
  });
  fs.appendFileSync("./.env", `GAME_ID=${gameId}\n`);
};

createGame();
