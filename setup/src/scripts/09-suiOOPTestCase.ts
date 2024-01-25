import { SuiClient } from "@mysten/sui.js/client";
import {
  ADMIN_SECRET_KEY,
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
import { ExecutorServiceHandler, TransactionBlockWithLambda } from "suioop";
import { getKeypair } from "../helpers/keypair/getKeyPair";
import { houseHitOrStandForSuiOOP } from "../helpers/actions/houseHitOrStandForSuiOOP";
import { getGameObject } from "../helpers/getObject/getGameObject";

const main = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });



  const houseDataId = await initialize({
    suiClient,
  });

  await delay(2000);

  const { gameId: gameId1, requestObjectId: hitRequest1 } =
    await initializeGameAndPrepareHit({
      playerSecretKey: BJ_PLAYER_SECRET_KEY,
      houseDataId,
      suiClient,
    });
  const { gameId: gameId2, requestObjectId: hitRequest2 } =
    await initializeGameAndPrepareHit({
      playerSecretKey: BJ_PLAYER_2_SECRET_KEY,
      houseDataId,
      suiClient,
    });

  await delay(2000);

  const game1 = await getGameObject({ suiClient, gameId: gameId1 });

  await delay(5000);
  console.log("Let's see...");

  const eshandler = await ExecutorServiceHandler.initialize(
    getKeypair(ADMIN_SECRET_KEY) as any,
    suiClient as any
  );

  console.log(eshandler);

  const txWithLambda1 = new TransactionBlockWithLambda(() =>
    houseHitOrStandForSuiOOP({
      gameId: gameId1,
      requestObjectId: hitRequest1,
      counter: game1.counter,
      user_randomness: game1.user_randomness,
      move: "hit",
      houseDataId,
    }) as any
  );
  eshandler.execute(txWithLambda1, suiClient as any, );

  const txWithLambda2 = new TransactionBlockWithLambda(() =>
    houseHitOrStandForSuiOOP({
      gameId: gameId2,
      requestObjectId: hitRequest2,
      counter: game1.counter,
      user_randomness: game1.user_randomness,
      move: "hit",
      houseDataId,
    }) as any
  );

  eshandler.execute(txWithLambda2, suiClient as any);
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
}: InitializeGameAndPrepareHitProps): Promise<{
  gameId: string;
  requestObjectId: string;
}> => {
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

  const requestObjectId = (await doPlayerHitOrStand({
    suiClient,
    gameId,
    playerSecretKey,
    move: "hit",
  })) as string;

  return { gameId, requestObjectId };
};

main();
