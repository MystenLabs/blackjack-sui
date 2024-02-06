import Image from "next/image";
import React from "react";
import { CardsHand } from "./CardsHand";

interface DealerCardsProps {
  cards: number[];
  points: number;
  won?: boolean;
}

export const DealerCards = ({ cards, points, won }: DealerCardsProps) => {
  return (
    <div className="flex flex-col space-y-[20px] items-center">
      <Image src="/dealer.svg" width={40} height={40} alt="dealer" />
      <CardsHand won={won} cards={cards} points={points} />
    </div>
  );
};
