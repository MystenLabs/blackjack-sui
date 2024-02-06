import Image from "next/image";
import React from "react";
import { CardsHand } from "./CardsHand";

interface DealerCardsProps {
  cards: number[];
  points: number;
}

export const DealerCards = ({ cards, points }: DealerCardsProps) => {
  return (
    <div className="flex flex-col space-y-[20px] items-center">
      <Image src="/dealer.svg" width={40} height={40} alt="dealer" />
      <CardsHand cards={cards} points={points} />
    </div>
  );
};
