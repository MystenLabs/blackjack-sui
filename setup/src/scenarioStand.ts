import { SuiClient } from "@mysten/sui.js/client";
import { HOUSE_DATA_ID, SUI_NETWORK } from "./config";
import { getIsHouseAdminCapBurnt } from "./helpers/getObject/getIsHouseAdminCapBurnt";
import { initializeHouseData } from "./helpers/actions/initializeHouseData";
import { createGameByPlayer } from "./helpers/actions/createGameByPlayer";
import { getGameObject } from "./helpers/getObject/getGameObject";
import { doInitialDeal } from "./helpers/actions/doinitialDeal";
import { doPlayerHitOrStand } from "./helpers/actions/playerHitOrStandRequest";
import { houseHitOrStand } from "./helpers/actions/houseHitOrStand";
import { GameOnChain } from "./types/GameOnChain";
import { delay } from "./helpers/general/delay";

interface FullScenarioState {
  houseDataId: string | null;
  gameId: string | null;
  game: GameOnChain | null;
}

const run = async () => {
  const suiClient = new SuiClient({
    url: SUI_NETWORK,
  });
  const playerSecretKey = "AOhmUbeF+mDZeW5Vk+jU0dGDcAYuxQES0ftRH505yAQv";

  const state: FullScenarioState = {
    houseDataId: null,
    gameId: null,
    game: null,
  };

  const refreshState = async () => {
    const game = await getGameObject({
      suiClient,
      gameId: state.gameId!,
    });
    console.log("Current game object:");
    const { user_randomness, ...rest } = game;
    console.log(rest);
    state.game = game;
  };

  const isFinalState = () => {
    const { status } = state.game!;
    if (!!state.game?.status) {
        console.log(`Game is finished: ${status === 1 ? "Player" : "House"} won!`)
    }
    else {
        console.log(`Game is still in progress`)
    }
    return !!status;
  }

  const isHouseAdminCapBurnt = await getIsHouseAdminCapBurnt({ suiClient });
  // if the house admin cap is not burnt
  // initialize the house data object
  if (!isHouseAdminCapBurnt) {
    const houseDataId = await initializeHouseData({ suiClient });
    if (!houseDataId) {
      throw new Error("House data initialization failed");
    }
    state.houseDataId = houseDataId;
  } else {
    // if the house admin cap is burnt
    // the house data object is already created
    // let's assume the creation was made via our setup script
    // and as a result we can retrieve its id from the HOUSE_DATA_ID env var
    state.houseDataId = HOUSE_DATA_ID;
  }

  await delay(2000);
  console.log("--------------------------");

  const gameId = await createGameByPlayer({
    suiClient,
    playerSecretKey,
  });
  if (!gameId) {
    throw new Error("Game creation failed");
  }
  state.gameId = gameId;

  await delay(2000);
  console.log("--------------------------");

  await refreshState();

  await delay(2000);
  console.log("--------------------------");

  await doInitialDeal({
    suiClient,
    gameId: state.gameId,
    houseDataId: state.houseDataId,
  });

  await delay(2000);
  console.log("--------------------------");

  await refreshState();

  await delay(2000);
  console.log("--------------------------");

  await doPlayerHitOrStand({
    suiClient,
    gameId: state.gameId,
    playerSecretKey,
    move: "stand",
  });

  await delay(2000);
  console.log("--------------------------");

  await houseHitOrStand({
    suiClient,
    eventParsedJson: {
      gameId: state.gameId,
      current_player_hand_sum: state.game!.player_sum,
    },
    move: "stand",
  });

  await delay(2000);
  console.log("--------------------------");

  await refreshState();

  await delay(2000);
  console.log("--------------------------");

  const isFinal = isFinalState();
  if (isFinal) {
    return;
  }
};

run();
