import React, {useEffect, useMemo, useState} from "react";
import { SetupGameStepper } from "../general/SetupGameStepper";
import { GameOnChain } from "@/types/GameOnChain";
import { RequestSUI } from "./RequestSUI";
import BigNumber from "bignumber.js";
import { Spinner } from "../general/Spinner";
import { StartGame } from "./StartGame";

interface SetupGameProps {
  balance: BigNumber;
  game: GameOnChain | null;
  isLoading: boolean;
  handleCreateGame: () => Promise<void>;
  isCreateGameLoading: boolean;
}

const BALANCE_LIMIT = BigNumber(0.5);

export const SetupGame = ({
  balance,
  game,
  isLoading,
  handleCreateGame,
  isCreateGameLoading,
}: SetupGameProps) => {
  const [step, setStep] = useState(1);
  const isLessThanBalanceLimit = useMemo(() => balance.isLessThan(BALANCE_LIMIT), [balance]);

  useEffect(() => {
    if (isLessThanBalanceLimit) {
      setStep(0);
    } else if (!game) {
      setStep(1);
    }
  }, [isLessThanBalanceLimit, game, isLoading]);

  const renderStep = () => {
    if (isLessThanBalanceLimit) {
      return <RequestSUI />;
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
