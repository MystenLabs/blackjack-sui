import React, { useState } from "react";
import Image from "next/image";
import { LoadingButton } from "../general/LoadingButton";
import { CollectMouseRandomness } from "./CollectMouseRandomness";
import Link from "next/link";

interface StartGameProps {
  handleCreateGame: (randomness: string) => Promise<void>;
  isLoading: boolean;
}

export const StartGame = ({ handleCreateGame, isLoading }: StartGameProps) => {
  const [isGeneratingRandomness, setIsGeneratingRandomness] = useState(false);

  if (isGeneratingRandomness) {
    return (
      <CollectMouseRandomness
        handleStartGame={handleCreateGame}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="bg-white flex flex-col p-[50px] w-full rounded-[24px] items-center space-y-[50px]">
      <div className="text-[25px] font-semibold text-center">Ready for a New Game?</div>
      <Image
        src="/general/new-game-cards.svg"
        alt="New Game"
        width={170}
        height={190}
      />
      <div className="text-center text-opacity-90 text-[14px] text-[#4F4F4F]">
        <div>
          Both you, and the house, will be placing a bet of <b>0.2 SUI</b>.
        </div>
        <div>The winner will take the pot.</div>
        <Link
          href="/rules"
          target="_blank"
          rel="noopenner noreferrer"
          className="flex items-center space-x-1 justify-center mt-1"
        >
          <div>Game Rules</div>
          <Image
            src="/general/arrow-top-right.svg"
            alt="Game Rules"
            width={8}
            height={8}
          />
        </Link>
      </div>
      <LoadingButton
        className="rounded-full py-[10px] px-[14px]"
        spinnerClassName="text-white !w-5 !h-5 mr-2"
        onClick={() => setIsGeneratingRandomness(true)}
        isLoading={isLoading}
      >
        New Game
      </LoadingButton>
    </div>
  );
};
