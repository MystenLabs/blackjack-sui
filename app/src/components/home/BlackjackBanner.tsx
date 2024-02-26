import React from "react";
import { PlayerCards } from "./PlayerCards";
import { GameOnChain } from "@/types/GameOnChain";
import Link from "next/link";

interface BlackjackBannerProps {
  game: GameOnChain;
  handleHide: () => void;
}

export const BlackjackBanner = ({ game, handleHide }: BlackjackBannerProps) => {
  return (
    <>
      <div
        className="absolute top-0 left-0 h-screen w-screen flex flex-col justify-center z-10 backdrop-blur-sm text-center"
        style={{
          backgroundImage: "url('/general/confetti.svg')",
          backgroundSize: "cover",
          backgroundPositionX: "center",
          backgroundPositionY: "top",
        }}
      ></div>
      <div
        className="absolute top-0 left-0 h-screen w-screen flex flex-col justify-center z-10 backdrop-blur-sm text-center"
        onClick={handleHide}
      >
        <PlayerCards
          cards={game.player_cards}
          points={game.player_sum}
          won
          lost={false}
          showIcon={false}
        />
        <div className="text-white text-[56px] font-bold">Blackjack!</div>
        <div className="text-white text-[18px] text-opacity-80">
          Congratulations, You Won!
        </div>
        <Link
          href="/new"
          className="w-[200px] mx-auto mt-[35px] text-sm rounded-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          New game
        </Link>
      </div>
    </>
  );
};
