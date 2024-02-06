"use client";

import React from "react";
import { useBlackjackGame } from "@/hooks/useBlackjackGame";
import { LoadingButton } from "../general/LoadingButton";
import { Spinner } from "../general/Spinner";
import { SuiExplorerLink } from "../general/SuiExplorerLink";
import { GeneralTable } from "../general/GeneralTable";
import { useWalletKit } from "@mysten/wallet-kit";
import { SignInBanner } from "./SignInBanner";
import { StartGame } from "./StartGame";
import { DealerCards } from "./DealerCards";
import { PlayerCards } from "./PlayerCards";

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
    <div className="p-10 min-h-[60vh] text-center font-bold text-xl space-y-20">
      {(isLoading || isMoveLoading) && (
        <div>
          <Spinner />
        </div>
      )}
      <DealerCards cards={game.dealer_cards} points={game.dealer_sum} />
      <PlayerCards cards={game.player_cards} points={game.player_sum} />
      <GeneralTable
        caption="State of the game"
        showFooter={false}
        headers={[
          "Game",
          "Status",
          "Player",
          "Counter",
          "Player points",
          "Dealer points",
        ]}
        state={{
          page: 0,
          pageSize: 10,
          isLoading: false,
        }}
        rows={[
          {
            id: "player_points",
            columns: [
              <SuiExplorerLink
                key="game-id"
                type="object"
                objectId={game.id.id}
                className="text-primary"
              />,
              game.status === 0
                ? "In progress"
                : game.status === 1
                ? "You won!"
                : "You lost!",
              <SuiExplorerLink
                key="game-player"
                type="address"
                objectId={game.player}
              />,
              <SuiExplorerLink
                key="counter"
                type="object"
                objectId={counterId}
              />,
              `${game.player_sum}`,
              `${game.dealer_sum}`,
            ],
            isSelected: false,
          },
        ]}
      />
      {game.status === 0 && (
        <div className="flex justify-center space-x-10 items-center py-5">
          <LoadingButton
            onClick={handleHit}
            isLoading={isMoveLoading}
            className="w-[300px]"
          >
            Hit
          </LoadingButton>
          <LoadingButton
            onClick={handleStand}
            isLoading={isMoveLoading}
            className="w-[300px]"
          >
            Stand
          </LoadingButton>
        </div>
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
  );
};
