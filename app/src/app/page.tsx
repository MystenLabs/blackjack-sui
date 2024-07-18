"use client";

import React, { useEffect, useState } from "react";
import { useBlackjackGame } from "@/hooks/useBlackjackGame";
import { Spinner } from "../components/general/Spinner";
import { SignInBanner } from "../components/home/SignInBanner";
import { DealerCards } from "../components/home/DealerCards";
import { PlayerCards } from "../components/home/PlayerCards";
import { GameActions } from "../components/home/GameActions";
import Image from "next/image";
import { BlackjackBanner } from "@/components/home/BlackjackBanner";
import { useZkLogin } from "@mysten/enoki/react";
import { useBalance } from "@/contexts/BalanceContext";
import { SuiExplorerLink } from "@/components/general/SuiExplorerLink";
import BigNumber from "bignumber.js";
import { SetupGame } from "@/components/home/SetupGame";
import Link from "next/link";

const HomePage = () => {
  const { address } = useZkLogin();
  const { balance, handleRefreshBalance } = useBalance();
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
  } = useBlackjackGame();

  const [showingBlackjackBanner, setShowingBlackjackBanner] = useState(false);
  const handleShowBlackjackBanner = () => setShowingBlackjackBanner(true);
  const handleHideBlackjackBanner = () => setShowingBlackjackBanner(false);

  useEffect(() => {
    setTimeout(() => {
      handleRefreshBalance();
    }, 2000);
  }, [game?.status]);

  useEffect(() => {
    if (
      game?.player_sum === 21 &&
      game?.player_cards?.length === 2 &&
      game?.status === 1
    ) {
      handleShowBlackjackBanner();
    }
  }, [game?.player_sum, game?.status]);

  if (!address) {
    return <SignInBanner />;
  }

  if (isCounterIdLoading) {
    return <Spinner />;
  }

  if (balance.isLessThan(BigNumber(0.5)) || !counterId || !game) {
    return (
      <SetupGame
        balance={balance}
        counterId={counterId}
        handleCreateCounter={handleCreateCounter}
        isCreateCounterLoading={isCreateCounterLoading}
        game={game}
        isLoading={isLoading}
        handleCreateGame={handleCreateGame}
        isCreateGameLoading={isCreateGameLoading}
      />
    );
  }

  if (showingBlackjackBanner) {
    return (
      <BlackjackBanner game={game} handleHide={handleHideBlackjackBanner} />
    );
  }

  return (
    <div className="relative min-h-[60vh] text-center font-bold text-xl">
      <div className="mx-auto absolute right-10 top-0">
        <div className="relative">
          <Image
            src="/general/cards-stack.svg"
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
      <div className="relative space-y-[55px]">
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
            playerPoints={game.player_sum}
          />
        )}
        {game.status !== 0 && (
          <div className="flex flex-col items-center space-y-[20px]">
            <div className="flex flex-col items-center space-y-[5px]">
              <div className="text-gray-100">The game is finished!</div>
              {game.status === 3 && (
                <div className="text-gray-300">It&apos;s a tie!</div>
              )}
              <div className="flex space-x-1 items-center">
                <div className="text-gray-100 text-sm">
                  Object on Sui Explorer:
                </div>
                <SuiExplorerLink
                  objectId={game.id.id}
                  type="object"
                  className="!text-gray-300 text-sm"
                />
              </div>
            </div>
            <Link
              href="/new"
              className="w-[200px] text-sm rounded-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              New game
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
