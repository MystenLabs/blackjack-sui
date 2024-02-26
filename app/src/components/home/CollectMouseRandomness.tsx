import Image from "next/image";
import React from "react";
import { LoadingButton } from "../general/LoadingButton";
import { Spinner } from "../general/Spinner";
import { useMouseRandomness } from "@/hooks/useMouseRandomness";
import { bytesToHex } from "@noble/curves/abstract/utils";

interface CollectMouseRandomnessProps {
  handleStartGame: (randomness: string) => void;
  isLoading: boolean;
}

export const CollectMouseRandomness = ({
  handleStartGame,
  isLoading,
}: CollectMouseRandomnessProps) => {
  const { randomness, gathered } = useMouseRandomness();

  if (!gathered) {
    return (
      <div className="bg-white flex flex-col p-[50px] max-w-[480px] mx-auto rounded-[24px] items-center space-y-[32px]">
        <Image
          src="/general/randomness-cards.svg"
          alt="Randomness"
          width={170}
          height={190}
        />
        <Spinner />
        <div className="flex flex-col items-center space-y-[10px]">
          <div className="text-[25px] font-semibold text-center space-y-[5px]">
            <div>Generating randomness</div>
            <div className="text-[20px]">
              Keep moving your cursor / dragging your finger across the screen
            </div>
          </div>
          <div className="text-center text-opacity-90 text-[14px] text-[#4F4F4F]">
            This movement shuffles the cards for a randomized, secure
            game play.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col p-[50px] max-w-[480px] mx-auto rounded-[24px] items-center space-y-[50px]">
      <div className="text-[25px] text-center font-semibold">
        The cards are now shuffled!
      </div>
      <div className="text-center text-opacity-90 text-[14px] text-[#4F4F4F]">
        [{randomness.join(", ")}]
      </div>
      <LoadingButton
        className="rounded-full py-[10px] px-[14px]"
        spinnerClassName="text-white !w-5 !h-5 mr-2"
        onClick={() => handleStartGame(bytesToHex(Uint8Array.from(randomness)))}
        isLoading={isLoading}
      >
        Let&apos;s Play!
      </LoadingButton>
    </div>
  );
};
