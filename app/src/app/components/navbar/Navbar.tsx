"use client";

import { ConnectButton } from "@mysten/wallet-kit";
import React from "react";
import suiLogo from "@/app/assets/sui-logo.png";
import Image from 'next/image';

export const Navbar = () => {

  return (
    <div className="flex justify-between items-center p-[8px] h-[60px] border-b-gray-400 border-b-[1px] sticky top-0">
      <div className="flex justify-start items-center gap-[14px]">
          <h1 className="text-3xl font-normal mb-3">
              <Image src={suiLogo} alt="Sui" className="inline w-7"/> Blackjack </h1>
      </div>
      <ConnectButton />
    </div>
  );
};
