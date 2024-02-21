import React from "react";
import { LoadingButton } from "./LoadingButton";
import { useRequestSui } from "@/hooks/useRequestSui";
import { formatSUIAmount } from "@/helpers/formatSUIAmount";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Balance = () => {
  const { balance, isLoading, handleRequestSui } = useRequestSui();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <LoadingButton
            onClick={handleRequestSui}
            isLoading={isLoading}
            className="flex space-x-2 items-center border-[1px] border-custom-border rounded-[36px] px-[10px] bg-[inherit] hover:bg-[#12BF77]"
            spinnerClassName="w-5 h-5"
          >
            <Image src="/general/sui.svg" alt="plus" width={10} height={10} />
            <div className="text-white text-opacity-90 text-sm">
              {formatSUIAmount(balance)} SUI
            </div>
            <Image src="/general/plus.svg" alt="plus" width={20} height={20} />
          </LoadingButton>
        </TooltipTrigger>
        <TooltipContent>
          <p>Request SUI</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
