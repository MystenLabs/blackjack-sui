import Image from "next/image";
import React from "react";
import { CardsHand } from "./CardsHand";

interface PlayerCardsProps {
  cards: number[];
  points: number;
  won?: boolean;
}

export const PlayerCards = ({ cards, points, won }: PlayerCardsProps) => {
  return (
    <div className="flex flex-col space-y-[20px] items-center">
      <CardsHand won={won} cards={cards} points={points} />
      <Image src="/player.svg" width={40} height={40} alt="player" />
    </div>
  );
};