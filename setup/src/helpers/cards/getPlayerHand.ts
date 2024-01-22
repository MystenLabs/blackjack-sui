import { Card, CardsMap } from "../../types/Card";

interface GetPlayerHandProps {
  cardsMap: CardsMap;
  playerCards: number[];
}
export const getPlayerHand = ({ cardsMap, playerCards }: GetPlayerHandProps) => {
  const playerInitialHand: Card[] = [];
  playerCards.forEach((cardIndex) => {
    const card = cardsMap[cardIndex];
    playerInitialHand.push(card);
  });
  return playerInitialHand;
};
