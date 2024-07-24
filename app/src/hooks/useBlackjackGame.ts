import { useEffect, useState } from "react";
import { GameOnChain } from "@/types/GameOnChain";
import { useSui } from "./useSui";
import { usePlayerCounter } from "./usePlayerCounter";
import { getGameObject } from "@/utils/getGameObject";
import { useCreateBlackjackGame } from "./useCreateBlackjackGame";
import { useMakeMoveInBlackjackGame } from "./useMakeMoveInBlackjackGame";
import { useZkLogin } from "@mysten/enoki/react";

export const useBlackjackGame = () => {
  const { address } = useZkLogin();
  const { suiClient } = useSui();
  const [game, setGame] = useState<GameOnChain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    counterId,
    handleCreateCounter,
    isLoading: isCounterIdLoading,
    isCreateLoading: isCreateCounterLoading,
  } = usePlayerCounter();
  const { handleCreateGameAndDeal, isCreateGameLoading, isInitialDealLoading } =
    useCreateBlackjackGame();
  const { handleHitOrStand, isMoveLoading } = useMakeMoveInBlackjackGame();

  const handleRestart = () => {
    setGame(null);
    setIsLoading(false);
  };

  useEffect(() => {
    handleRestart();
  }, [address]);

  // Receives the txDigest of the transaction that updated the game
  // Waits for this transaction block, and then re-fetches the game object
  const reFetchGame = async (gameId: string, txDigest?: string) => {
    if (!gameId) {
      setGame(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (!!txDigest) {
      await suiClient.waitForTransaction({
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

  const handleCreateGameAndRefresh = async (userRandomness: string) => {
    handleCreateGameAndDeal(counterId, userRandomness, reFetchGame).then(
      (resp) => {
        if (!resp) {
          return;
        }
        const { gameId, txDigest } = resp;
        reFetchGame(gameId, txDigest);
      }
    );
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
    isLoading,
    counterId,
    isCounterIdLoading,
    isCreateCounterLoading,
    handleCreateCounter,
    isCreateGameLoading,
    isInitialDealLoading,
    canCreateGame: !isLoading && !isCounterIdLoading && !game?.id.id,
    handleCreateGame: handleCreateGameAndRefresh,
    isMoveLoading,
    handleHit: () => handleMakeMoveAndRefresh("hit"),
    handleStand: () => handleMakeMoveAndRefresh("stand"),
    handleRestart,
  };
};
