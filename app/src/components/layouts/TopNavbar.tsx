import React from "react";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";
import Link from "next/link";

export const TopNavbar = () => {
  const { currentAccount } = useWalletKit();
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAccount?.address!);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="sticky top-0 flex w-full h-full bg-inherit p-5 space-x-2 md:space-x-4 justify-between items-center z-10">
      <Link href="/" className="min-w-[150px] text-2xl font-bold text-white">
        Mysten Blackjack
      </Link>
      <div className="flex justify-end items-center space-x-1">
        {!!currentAccount?.address && (
          <div className="flex space-x-2 justify-end items-center">
            <Button onClick={handleCopyAddress} variant="link">
              <CopyIcon className="w-5 h-5 text-white" />
            </Button>
            <ConnectButton className="!bg-white !text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
