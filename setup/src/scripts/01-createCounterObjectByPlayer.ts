import { SuiClient } from "@mysten/sui/client";
import { createCounterObjectByPlayer } from "../helpers/actions/createCounterObjectByPlayer";
import { BJ_PLAYER_SECRET_KEY, SUI_NETWORK } from "../config";

const suiClient = new SuiClient({
  url: SUI_NETWORK,
});

if (!BJ_PLAYER_SECRET_KEY) {
  throw new Error("BJ_PLAYER_SECRET_KEY is not set in your .env file");
}

createCounterObjectByPlayer({
  suiClient,
  playerSecretKey: BJ_PLAYER_SECRET_KEY,
});
