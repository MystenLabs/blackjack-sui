import Image from "next/image";
import React from "react";
import { LoadingButton } from "../general/LoadingButton";

interface StartGameProps {
  handleCreateGame: () => Promise<void>;
  isLoading: boolean;
}

export const StartGame = ({ handleCreateGame, isLoading }: StartGameProps) => {
  return (
    <div className="bg-white flex flex-col p-[50px] max-w-[480px] mx-auto rounded-[24px] items-center space-y-[50px]">
      <div className="text-[25px] font-semibold">Ready for a New Game?</div>
      <Image
        src="/new-game-cards.svg"
        alt="New Game"
        width={170}
        height={190}
      />
      <LoadingButton
        className="rounded-full py-[10px] px-[14px]"
        spinnerClassName="text-white !w-5 !h-5 mr-2"
        onClick={handleCreateGame}
        isLoading={isLoading}
      >
        New Game
      </LoadingButton>
    </div>
  );
};
