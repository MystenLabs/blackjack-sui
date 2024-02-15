import Image from "next/image";
import React from "react";
import { CardsHand } from "./CardsHand";

interface PlayerCardsProps {
  cards: number[];
  points: number;
  won?: boolean;
  lost?: boolean;
  showIcon?: boolean;
}

export const PlayerCards = ({
  cards,
  points,
  won,
  lost,
  showIcon = true,
}: PlayerCardsProps) => {
  return (
    <div
      className={`flex flex-col ${
        won ? "space-y-0" : "space-y-[20px]"
      } items-center`}
    >
      <CardsHand won={won} lost={lost} cards={cards} points={points} />
      {showIcon && (
        <Image src="/general/player.svg" width={40} height={40} alt="player" />
      )}
    </div>
  );
};
