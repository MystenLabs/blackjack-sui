import React from "react";
import { LoadingButton } from "./LoadingButton";
import { useRequestSui } from "@/hooks/useRequestSui";
import { formatSUIAmount } from "@/helpers/formatSUIAmount";
import Image from "next/image";
import { useBalance } from "@/contexts/BalanceContext";
import BigNumber from "bignumber.js";

export const Balance = () => {
  const { isLoading, handleRequestSui } = useRequestSui();
  const { balance } = useBalance();

  return (
    <div className="flex space-x-2 items-center">
      <div className="flex space-x-2 items-center h-10 border-[1px] border-custom-border rounded-[36px] px-[10px] bg-[inherit]">
        <Image src="/general/sui.svg" alt="plus" width={10} height={10} />
        <div className="flex space-x-1 text-white text-opacity-90 text-sm font-semibold">
          <span>{formatSUIAmount(balance)} </span>
          <span className="hidden md:block">SUI</span>
        </div>
      </div>
      {balance <= BigNumber(0.5) && (
        <LoadingButton
          onClick={handleRequestSui}
          isLoading={isLoading}
          className="flex space-x-0 md:space-x-2 items-center border-[1px] border-custom-border rounded-[36px] px-[10px] bg-[inherit] hover:bg-[#12BF77]"
          spinnerClassName="!w-5 !h-5"
        >
          <Image src="/general/plus.svg" alt="plus" width={20} height={20} />
          <div className="hidden md:block font-semibold">Top up</div>
        </LoadingButton>
      )}
    </div>
  );
};
