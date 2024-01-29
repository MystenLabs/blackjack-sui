import { useEffect, useState } from "react";
import { GameOnChain } from "@/types/GameOnChain";
import { useSui } from "./useSui";
import { usePlayerCounter } from "./usePlayerCounter";
import { getGameObject } from "@/utils/getGameObject";
import { useCreateBlackjackGame } from "./useCreateBlackjackGame";
import { useMakeMoveInBlackjackGame } from "./useMakeMoveInBlackjackGame";
import { useWalletKit } from "@mysten/wallet-kit";

export const useBlackjackGame = () => {
  const { currentAccount } = useWalletKit();
  const { suiClient } = useSui();
  const [game, setGame] = useState<GameOnChain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    counterId,
    handleCreateCounter,
    isLoading: isCounterIdLoading,
  } = usePlayerCounter();
  const { handleCreateGame, isCreateGameLoading } = useCreateBlackjackGame();
  const { handleHitOrStand, isMoveLoading } = useMakeMoveInBlackjackGame();

  useEffect(() => {
    setGame(null);
    setIsLoading(false);
  }, [currentAccount?.address]);
  
  const reFetchGame = async (gameId: string, txDigest?: string) => {
    if (!gameId) {
      setGame(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (!!txDigest) {
      await suiClient.waitForTransactionBlock({
        digest: txDigest,
        timeout: 10_000,
      });
    }
    getGameObject({ suiClient, gameId })
      .then((game) => {
        setGame(game);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setGame(null);
        setIsLoading(false);
      });
  };

  const handleCreateGameAndRefresh = async () => {
    handleCreateGame(counterId).then((resp) => {
      if (!resp) {
        return;
      }
      const { gameId, txDigest } = resp;
      reFetchGame(gameId, txDigest);
    });
  };

  const handleMakeMoveAndRefresh = (move: "hit" | "stand") => {
    handleHitOrStand({ move, game, gameId: game?.id.id! }).then((resp) => {
      if (!resp) return;
      const { gameId, txDigest } = resp;
      reFetchGame(gameId, txDigest);
    });
  };

  return {
    game,
    isLoading: isLoading,
    counterId,
    isCounterIdLoading,
    handleCreateCounter,
    isCreateGameLoading,
    canCreateGame: !isLoading && !isCounterIdLoading && !game?.id.id,
    handleCreateGame: handleCreateGameAndRefresh,
    isMoveLoading,
    handleHit: () => handleMakeMoveAndRefresh("hit"),
    handleStand: () => handleMakeMoveAndRefresh("stand"),
  };
};