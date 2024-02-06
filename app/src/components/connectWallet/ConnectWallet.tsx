import { ConnectButton } from "@mysten/wallet-kit";
import React from "react";

export const ConnectWallet = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-5 py-12">
      <div className="text-2xl font-semibold">Welcome</div>
      <div className="text-lg">Connect your Wallet to continue</div>
      <ConnectButton className="!bg-primary" />
    </div>
  );
};
