"use client";

import React from "react";
import { useBlackjackGame } from "@/hooks/useBlackjackGame";
import { LoadingButton } from "../general/LoadingButton";

export const HomePage = () => {
  const {
    game,
    isLoading,
    handleCreateGame,
    counterId,
    isCounterIdLoading,
    handleCreateCounter,
    handleHit,
    handleStand,
    isMoveLoading,
  } = useBlackjackGame();
  return (
    <div className="p-10 min-h-[60vh] text-center font-bold text-xl">
      <div>
        Game: {isLoading ? "Loading..." : JSON.stringify(game, null, 2)}
      </div>
      <div>
        Counter id: {isCounterIdLoading ? "Loading..." : counterId || "-"}
      </div>
      <div className="flex flex-col justify-center items-center space-y-5 p-10">
        <LoadingButton
          onClick={handleCreateCounter}
          isLoading={isLoading}
          disabled={!!counterId}
          className="w-[300px]"
        >
          Get counter
        </LoadingButton>
        <LoadingButton
          onClick={handleCreateGame}
          isLoading={isLoading}
          className="w-[300px]"
        >
          Create game
        </LoadingButton>
        <hr className="bg-primary w-full" />
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
    </div>
  );
};
