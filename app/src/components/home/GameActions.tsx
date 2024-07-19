import React from "react";
import { LoadingButton } from "../general/LoadingButton";
import Image from "next/image";

interface GameActionsProps {
  handleHit: () => void;
  handleStand: () => void;
  isMoveLoading: boolean;
  playerPoints: number;
}

export const GameActions = ({
  handleHit,
  handleStand,
  isMoveLoading,
  playerPoints,
}: GameActionsProps) => {
  return (
    <div className="flex justify-center space-x-[15px] items-center py-5">
      <LoadingButton
        onClick={handleHit}
        isLoading={isMoveLoading}
        showSpinner={false}
        disabled={playerPoints === 21 || isMoveLoading}
        className="flex space-x-2 w-[150px] bg-transparent hover:bg-[#14C57A] border-[2px] rounded-[38px] !py-[16px] !px-[20px]"
      >
        <Image
          src="/actions/hit.svg"
          alt="Hit"
          width={16}
          height={16}
          className="inline-block"
        />
        <div className="text-[16px] font-semibold">Hit</div>
      </LoadingButton>
      <LoadingButton
        onClick={handleStand}
        isLoading={isMoveLoading}
        showSpinner={false}
        className="flex space-x-2 w-[150px] bg-transparent hover:bg-[#14C57A] border-[2px] rounded-[38px] !py-[16px] !px-[20px]"
      >
        <Image
          src="/actions/stand.svg"
          alt="Hit"
          width={16}
          height={16}
          className="inline-block"
        />
        <div className="text-[16px] font-semibold">Stand</div>
      </LoadingButton>
    </div>
  );
};
