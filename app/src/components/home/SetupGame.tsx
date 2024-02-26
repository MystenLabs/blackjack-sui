import React, { useEffect, useState } from "react";
import { SetupGameStepper } from "../general/SetupGameStepper";
import { GameOnChain } from "@/types/GameOnChain";
import { CreateCounter } from "./CreateCounter";
import { RequestSUI } from "./RequestSUI";
import BigNumber from "bignumber.js";
import { Spinner } from "../general/Spinner";
import { StartGame } from "./StartGame";

interface SetupGameProps {
  balance: BigNumber;
  counterId: string | null;
  handleCreateCounter: () => void;
  isCreateCounterLoading: boolean;
  game: GameOnChain | null;
  isLoading: boolean;
  handleCreateGame: (userRandomness: string) => Promise<void>;
  isCreateGameLoading: boolean;
}

const BALANCE_LIMIT = BigNumber(0.5);

export const SetupGame = ({
  balance,
  counterId,
  handleCreateCounter,
  isCreateCounterLoading,
  game,
  isLoading,
  handleCreateGame,
  isCreateGameLoading,
}: SetupGameProps) => {
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (balance.isLessThan(BALANCE_LIMIT)) {
      setStep(0);
    } else if (!counterId) {
      setStep(1);
    } else if (!game) {
      setStep(2);
    }
  }, [balance.isLessThan(BALANCE_LIMIT), counterId, game, isLoading]);

  const renderStep = () => {
    if (balance.isLessThan(BALANCE_LIMIT)) {
      return <RequestSUI />;
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
    if (!game) {
      if (isLoading) {
        return <Spinner />;
      }
      return (
        <StartGame
          handleCreateGame={handleCreateGame}
          isLoading={isCreateGameLoading}
        />
      );
    }
  };

  return (
    <div className="flex flex-col space-y-1 max-w-[480px] w-full mx-auto">
      <SetupGameStepper step={step} />
      {renderStep()}
    </div>
  );
};
