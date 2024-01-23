export interface GameOnChain {
  id: {
    id: string;
  };
  counter: number;
  dealer_cards: number[];
  dealer_sum: number;
  player_cards: number[];
  player_sum: number;
  status: number;
  total_stake: string;
  user_randomness: number[];
}
