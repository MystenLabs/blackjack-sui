"use client";

import React from "react";
import { useBlackjackGame } from "@/hooks/useBlackjackGame";
import { LoadingButton } from "../components/general/LoadingButton";
import { Spinner } from "../components/general/Spinner";
import { useWalletKit } from "@mysten/wallet-kit";
import { SignInBanner } from "../components/home/SignInBanner";
import { StartGame } from "../components/home/StartGame";
import { DealerCards } from "../components/home/DealerCards";
import { PlayerCards } from "../components/home/PlayerCards";
import { GameActions } from "../components/home/GameActions";
import { CreateCounter } from "../components/home/CreateCounter";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const { currentAccount } = useWalletKit();
  const {
    game,
    isLoading,
    handleCreateGame,
    isCreateGameLoading,
    isInitialDealLoading,
    counterId,
    isCounterIdLoading,
    isCreateCounterLoading,
    handleCreateCounter,
    handleHit,
    handleStand,
    isMoveLoading,
    handleRestart,
  } = useBlackjackGame();

  if (!currentAccount?.address) {
    return <SignInBanner />;
  }

  if (isCounterIdLoading) {
    return <Spinner />;
  }

  if (!counterId) {
    return (
      <CreateCounter
        handleCreateCounter={handleCreateCounter}
        isLoading={isCreateCounterLoading}
        counterId={counterId}
      />
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
      <div className="mx-auto absolute right-10 top-0">
        <div className="relative">
          <Image
            src="/cards-stack.svg"
            alt="cards-stack"
            width={227}
            height={170}
          />
          {(isLoading || isMoveLoading || isInitialDealLoading) && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-x-30px translate-y-5px">
              <Spinner />
            </div>
          )}
        </div>
      </div>
      <div className="space-y-20">
        <DealerCards
          cards={game.dealer_cards}
          points={game.dealer_sum}
          won={game.status === 2}
          lost={game.status === 1}
        />
        <PlayerCards
          cards={game.player_cards}
          points={game.player_sum}
          won={game.status === 1}
          lost={game.status === 2}
        />
        {game.status === 0 && (
          <GameActions
            handleHit={handleHit}
            handleStand={handleStand}
            isMoveLoading={isMoveLoading || isInitialDealLoading}
          />
        )}
        {game.status !== 0 && (
          <div>
            <Button
              onClick={handleRestart}
              className="rounded-full !py-[21px] px-[24px]"
            >
              New game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
