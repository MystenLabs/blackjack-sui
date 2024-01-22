import { Card } from "../../types/Card";

const suits = ["Clubs", "Diamonds", "Hearts", "Spades"];
const values = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export const generateCards = () => {
  let cards: { [key: number]: Card } = {};
  let i: number = 0;
  for (const suit of suits) {
    for (const value of values) {
      const card = {
        index: i,
        suit: suit,
        value: value,
      };
      cards[i] = card;
      i++;
    }
  }
  return cards;
};
