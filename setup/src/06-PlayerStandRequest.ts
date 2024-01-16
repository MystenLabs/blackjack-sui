import { GAME_ID } from "./config";
import { doPlayerHitOrStand } from "./scenarios/playerHitOrStandRequest";

doPlayerHitOrStand({
  gameId: GAME_ID,
  move: "stand",
});
