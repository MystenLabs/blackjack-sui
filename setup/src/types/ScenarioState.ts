import { GameOnChain } from "./GameOnChain";

export interface ScenarioState {
  houseDataId: string | null;
  gameId: string | null;
  game: GameOnChain | null;
}
