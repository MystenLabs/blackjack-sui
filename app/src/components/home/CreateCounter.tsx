import React from "react";
import { LoadingButton } from "../general/LoadingButton";
import Image from "next/image";

interface CreateCounterProps {
  handleCreateCounter: () => void;
  isLoading: boolean;
  counterId: string | null;
}

export const CreateCounter = ({
  handleCreateCounter,
  isLoading,
  counterId,
}: CreateCounterProps) => {
  return (
    <div className="bg-white flex flex-col p-[50px] w-full rounded-[24px] items-center space-y-[50px]">
      <div className="text-[25px] font-semibold">First time here?</div>
      <Image
        src="/general/new-game-cards.svg"
        alt="New Game"
        width={170}
        height={190}
      />
      <div className={`text-sm text-center text-[#4F4F4F]`}>
        You need a counter NFT before playing, so that we can keep track of your
        games, and generate the required randomness for shuffling the deck before
        each game.
      </div>
      <LoadingButton
        onClick={handleCreateCounter}
        isLoading={isLoading}
        disabled={!!counterId}
        className="!px-[14px] !py-[14px] rounded-full"
        spinnerClassName="text-white !w-5 !h-5 mr-2"
      >
        Get counter NFT
      </LoadingButton>
    </div>
  );
};
