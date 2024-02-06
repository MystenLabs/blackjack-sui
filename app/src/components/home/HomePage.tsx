"use client";

import React from "react";
import { useBlackjackGame } from "@/hooks/useBlackjackGame";
import { LoadingButton } from "../general/LoadingButton";
import { Spinner } from "../general/Spinner";
import { useWalletKit } from "@mysten/wallet-kit";
import { SignInBanner } from "./SignInBanner";
import { StartGame } from "./StartGame";
import { DealerCards } from "./DealerCards";
import { PlayerCards } from "./PlayerCards";
import { GameActions } from "./GameActions";
import Image from "next/image";

export const HomePage = () => {
  const { currentAccount } = useWalletKit();
  const {
    game,
    isLoading,
    handleCreateGame,
    isCreateGameLoading,
    counterId,
    isCounterIdLoading,
    handleCreateCounter,
    handleHit,
    handleStand,
    isMoveLoading,
  } = useBlackjackGame();

  if (!currentAccount?.address) {
    return <SignInBanner />;
  }

  if (isCounterIdLoading) {
    return <Spinner />;
  }

  if (!counterId) {
    return (
      <div className="w-full flex flex-col items-center p-10">
        <LoadingButton
          onClick={handleCreateCounter}
          isLoading={isLoading}
          disabled={!!counterId}
          className="w-[300px]"
        >
          Get your counter object!
        </LoadingButton>
      </div>
    );
  }

  if (!game && isLoading) {
    return <Spinner />;
  }

  if (!game) {
    if (!isLoading) {
      return (
        <StartGame
          handleCreateGame={handleCreateGame}
          isLoading={isCreateGameLoading}
        />
      );
    }
    return <Spinner />;
  }

  return (
    <div className="relative p-10 min-h-[60vh] text-center font-bold text-xl">
      <Image
        src="/cards-stack.svg"
        alt="cards-stack"
        width={227}
        height={170}
        className="mx-auto rotate-60 absolute right-10 top-0"
      />
      <div className="space-y-20">
        <DealerCards
          cards={game.dealer_cards}
          points={game.dealer_sum}
          won={game.status === 2}
        />
        <PlayerCards
          cards={game.player_cards}
          points={game.player_sum}
          won={game.status === 1}
        />
        {(isLoading || isMoveLoading) && (
          <div>
            <Spinner />
          </div>
        )}
        {game.status === 0 && (
          <GameActions
            handleHit={handleHit}
            handleStand={handleStand}
            isMoveLoading={isMoveLoading}
          />
        )}
        {game.status !== 0 && (
          <div>
            <LoadingButton
              onClick={handleCreateGame}
              isLoading={isCreateGameLoading}
              className="w-[300px]"
            >
              Play new game
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );
};
