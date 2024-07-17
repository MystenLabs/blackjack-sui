import { SuiClient } from "@mysten/sui/client";
import { doPlayerHitOrStand } from "../helpers/actions/playerHitOrStandRequest";
import { BJ_PLAYER_SECRET_KEY, GAME_ID, SUI_NETWORK } from "../config";

if (!BJ_PLAYER_SECRET_KEY) {
  throw new Error("BJ_PLAYER_SECRET_KEY is not set in your .env file");
}

doPlayerHitOrStand({
  playerSecretKey: BJ_PLAYER_SECRET_KEY,
  suiClient: new SuiClient({ url: SUI_NETWORK }),
  gameId: GAME_ID,
  move: "hit",
});
