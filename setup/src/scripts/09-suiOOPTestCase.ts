import { SuiClient } from "@mysten/sui.js/client";
import {
  BJ_PLAYER_2_SECRET_KEY,
  BJ_PLAYER_SECRET_KEY,
  HOUSE_DATA_ID,
  SUI_NETWORK,
} from "../config";
import { getIsHouseAdminCapBurnt } from "../helpers/getObject/getIsHouseAdminCapBurnt";
import { initializeHouseData } from "../helpers/actions/initializeHouseData";
import { delay } from "../helpers/general/delay";
import { createGameByPlayer } from "../helpers/actions/createGameByPlayer";
import { doInitialDeal } from "../helpers/actions/doinitialDeal";
import { doPlayerHitOrStand } from "../helpers/actions/playerHitOrStandRequest";
import { houseHitOrStand } from "../helpers/actions/houseHitOrStand";

const main = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });

  const houseDataId = await initialize({
    suiClient,
  });

  await delay(2000);

  const gameId1 = await initializeGameAndPrepareHit({
    playerSecretKey: BJ_PLAYER_SECRET_KEY,
    houseDataId,
    suiClient,
  });
  const gameId2 = await initializeGameAndPrepareHit({
    playerSecretKey: BJ_PLAYER_2_SECRET_KEY,
    houseDataId,
    suiClient,
  });

  await delay(2000);

  houseHitOrStand({
    suiClient,
    gameId: gameId1,
    move: "hit",
    houseDataId,
  });

  houseHitOrStand({
    suiClient,
    gameId: gameId2,
    move: "hit",
    houseDataId,
  });
};

interface InitializeGameAndPrepareHitProps {
  playerSecretKey: string;
  houseDataId: string;
  suiClient: SuiClient;
}

interface InitialzeProps {
  suiClient: SuiClient;
}

const initialize = async ({ suiClient }: InitialzeProps) => {
  console.log("Initializing...");
  const isHouseAdminCapBurnt = await getIsHouseAdminCapBurnt({
    suiClient,
  });
  console.log(`AdminCap is ${isHouseAdminCapBurnt ? "" : "not "}burnt`);
  if (!isHouseAdminCapBurnt) {
    const newHouseDataId = await initializeHouseData({
      suiClient,
    });
    if (!newHouseDataId) {
      throw new Error("House data initialization failed");
    }
    return newHouseDataId;
  }
  return HOUSE_DATA_ID;
};

const initializeGameAndPrepareHit = async ({
  playerSecretKey,
  houseDataId,
  suiClient,
}: InitializeGameAndPrepareHitProps): Promise<string> => {
  let gameId = "";

  await createGameByPlayer({
    suiClient,
    playerSecretKey,
    houseDataId,
  })
    .then((createdGameId) => {
      if (createdGameId) {
        gameId = createdGameId;
      } else {
        throw new Error("Game creation failed");
      }
    })
    .catch((err) => {
      console.log(err);
    });

  await delay(2000);

  await doInitialDeal({
    suiClient,
    gameId,
    houseDataId,
  });

  await delay(2000);

  await doPlayerHitOrStand({
    suiClient,
    gameId,
    playerSecretKey,
    move: "hit",
  });

  return gameId;
};

main();
