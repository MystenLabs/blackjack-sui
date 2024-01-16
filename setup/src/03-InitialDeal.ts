import { GAME_ID, HOUSE_DATA_ID } from "./config";
import { doInitialDeal } from "./scenarios/doinitialDeal";

doInitialDeal({
  gameId: GAME_ID,
  houseDataId: HOUSE_DATA_ID,
});
