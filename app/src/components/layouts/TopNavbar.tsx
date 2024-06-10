import React from "react";
import Link from "next/link";
import { useZkLogin } from "@mysten/enoki/react";
import { UserProfileMenu } from "../general/UserProfileMenu";
import { Balance } from "../general/Balance";

export const TopNavbar = () => {
  const { address } = useZkLogin();

  return (
    <>
      <div className={`fixed top-0 w-full flex justify-evenly z-30 transition-all`}>
        <div className="mx-5 flex h-16 items-center justify-end text-white ">
          <span>[Mysten Blackjack] is provided for testnet purposes only and do not involve real money or the opportunity to win real money.</span>
        </div>
      </div>
      <div
        className="backdrop-blur-md md:backdrop-blur-none w-full h-full bg-inherit p-5 space-x-2 md:space-x-4 justify-between items-center z-10">
        <Link href="/new" className="w-[min-content] md:w-[300px] text-2xl font-bold text-white">
          Mysten Blackjack
        </Link>
        <div className="flex flex-1 justify-end items-center space-x-1">
          {!!address && (
            <div className="flex space-x-2 items-center">
              <Balance/>
              <UserProfileMenu/>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
