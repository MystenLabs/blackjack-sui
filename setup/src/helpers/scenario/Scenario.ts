import { SuiClient } from "@mysten/sui/client";
import { ScenarioState } from "../../types/ScenarioState";
import { getGameObject } from "../getObject/getGameObject";
import { ScenarioStep, UserScenarioStep } from "../../types/ScenarioStep";
import { HOUSE_DATA_ID, SUI_NETWORK } from "../../config";
import { getIsHouseAdminCapBurnt } from "../getObject/getIsHouseAdminCapBurnt";
import { initializeHouseData } from "../actions/initializeHouseData";
import { createGameByPlayer } from "../actions/createGameByPlayer";
import { delay } from "../general/delay";
import { doPlayerHitOrStand } from "../actions/playerHitOrStandRequest";
import { houseHitOrStand } from "../actions/houseHitOrStand";
import { doInitialDeal } from "../actions/doinitialDeal";
import fs from "fs";

interface ScnearioConstructorProps {
  steps: UserScenarioStep[];
  playerSecretKey: string;
}

export class Scenario {
  private suiClient: SuiClient;
  private playerSecretKey: string;
  private state: ScenarioState;
  private steps: ScenarioStep[];
  private actions: { [key in ScenarioStep]: () => Promise<void> } = {
    initialize: async () => {
      console.log("Initializing...");
      const isHouseAdminCapBurnt = await getIsHouseAdminCapBurnt({
        suiClient: this.suiClient,
      });
      console.log(`AdminCap is ${isHouseAdminCapBurnt ? "" : "not "}burnt`);
      // if the house admin cap is not burnt
      // initialize the house data object
      if (!isHouseAdminCapBurnt) {
        const houseDataId = await initializeHouseData({
          suiClient: this.suiClient,
        });
        if (!houseDataId) {
          throw new Error("House data initialization failed");
        }
        fs.appendFileSync("./.env", `HOUSE_DATA_ID=${houseDataId}\n`);
        fs.appendFileSync(
          "../app/.env",
          `NEXT_PUBLIC_HOUSE_DATA_ID=${houseDataId}\n`
        );
        this.state.houseDataId = houseDataId;
      } else {
        // if the house admin cap is burnt
        // the house data object is already created
        // let's assume the creation was made via our setup script
        // and as a result we can retrieve its id from the HOUSE_DATA_ID env var
        this.state.houseDataId = HOUSE_DATA_ID;
      }
      console.log("HouseData:", this.state.houseDataId);
      await delay(2000);
      const gameId = await createGameByPlayer({
        suiClient: this.suiClient,
        playerSecretKey: this.playerSecretKey,
        houseDataId: this.state.houseDataId!,
      });
      if (!gameId) {
        throw new Error("Game creation failed");
      }
      this.state.gameId = gameId;
    },
    "initial-deal": async () => {
      await doInitialDeal({
        suiClient: this.suiClient,
        gameId: this.state.gameId!,
        houseDataId: this.state.houseDataId!,
      });
    },
    "request-hit": async () =>
      await doPlayerHitOrStand({
        suiClient: this.suiClient,
        gameId: this.state.gameId!,
        playerSecretKey: this.playerSecretKey,
        move: "hit",
      }),
    "request-stand": async () =>
      await doPlayerHitOrStand({
        suiClient: this.suiClient,
        gameId: this.state.gameId!,
        playerSecretKey: this.playerSecretKey,
        move: "stand",
      }),
    "house-hit": async () =>
      await houseHitOrStand({
        suiClient: this.suiClient,
        gameId: this.state.gameId!,
        move: "hit",
        houseDataId: this.state.houseDataId!,
      }),
    "house-stand": async () =>
      await houseHitOrStand({
        suiClient: this.suiClient,
        gameId: this.state.gameId!,
        move: "stand",
        houseDataId: this.state.houseDataId!,
      }),
  };

  constructor({ steps, playerSecretKey }: ScnearioConstructorProps) {
    this.playerSecretKey = playerSecretKey;
    this.suiClient = new SuiClient({
      url: SUI_NETWORK,
    });
    this.state = {
      houseDataId: null,
      gameId: null,
      game: null,
    };
    this.steps = ["initialize", "initial-deal", ...steps];
  }

  private async refreshState(): Promise<void> {
    const game = await getGameObject({
      suiClient: this.suiClient,
      gameId: this.state.gameId!,
    });
    console.log("Current game object:");
    const { user_randomness, ...rest } = game;
    console.log(rest);
    this.state.game = game;
  }

  private isFinalState(): boolean {
    const { status } = this.state.game!;
    if (!!this.state.game?.status) {
      console.log(
        `Game is finished: ${status === 1 ? "Player" : "House"} won!`
      );
    } else {
      console.log(`Game is still in progress`);
    }
    return !!status;
  }

  private async runStep(step: ScenarioStep): Promise<boolean> {
    await this.actions[step]();
    await delay(2000);
    console.log("--------------------------");

    await this.refreshState();
    await delay(2000);
    console.log("--------------------------");

    const isFinal2 = this.isFinalState();
    return isFinal2;
  }

  public async run() {
    for (const step of this.steps) {
      const isFinalState = await this.runStep(step);
      if (isFinalState) {
        break;
      }
    }
  }
}
