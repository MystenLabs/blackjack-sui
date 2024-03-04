import React from "react";
import { LoadingButton } from "../general/LoadingButton";
import Image from "next/image";
import { useRequestSui } from "@/hooks/useRequestSui";

export const RequestSUI = () => {
  const { handleRequestSui, isLoading } = useRequestSui();

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
        Looks like your Testnet SUI balance is less than 1 SUI. <br />
        You need some Testnet SUI to play the game.
      </div>
      <LoadingButton
        onClick={handleRequestSui}
        isLoading={isLoading}
        className="!px-[14px] !py-[14px] h-14 md:h-9 rounded-full flex items-center space-x-2"
        spinnerClassName="text-white !w-5 !h-5 mr-2"
      >
        <Image src="/general/plus.svg" alt="plus" width={20} height={20} />
        <div>Request Testnet SUI Tokens</div>
      </LoadingButton>
    </div>
  );
};
