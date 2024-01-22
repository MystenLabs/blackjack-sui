export interface Card {
  index: number;
  suit: string;
  value: string;
}

export type CardsMap = { [key: number]: Card };