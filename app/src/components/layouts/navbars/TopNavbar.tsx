import React from "react";
import { NavbarHeader } from "./NavbarHeader";
import { ConnectButton, useWalletKit } from "@mysten/wallet-kit";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "@radix-ui/react-icons";
import toast from "react-hot-toast";

export const TopNavbar = () => {
  const { currentAccount } = useWalletKit();
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAccount?.address!);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="sticky top-0 flex w-full h-full bg-inherit p-5 space-x-4 justify-between items-center">
      <NavbarHeader showCloseButton={false} onClose={() => {}} />
      <div className="flex justify-end items-center space-x-1">
        {!!currentAccount?.address && (
          <div className="flex space-x-2 justify-end items-center min-w-[250px]">
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
