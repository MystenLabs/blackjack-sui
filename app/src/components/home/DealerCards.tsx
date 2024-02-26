import Image from "next/image";
import React from "react";
import { CardsHand } from "./CardsHand";

interface DealerCardsProps {
  cards: number[];
  points: number;
  won?: boolean;
  lost?: boolean;
}

export const DealerCards = ({ cards, points, won, lost }: DealerCardsProps) => {
  return (
    <div className="flex flex-col space-y-[20px] items-center">
      <Image src="/general/dealer.svg" width={40} height={40} alt="dealer" />
      <CardsHand won={won} lost={lost} cards={cards} points={points} />
    </div>
  );
};
