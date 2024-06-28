import React from "react";
import Link from "next/link";
import { useZkLogin } from "@mysten/enoki/react";
import { UserProfileMenu } from "../general/UserProfileMenu";
import { Balance } from "../general/Balance";

export const TopNavbar = () => {
  const { address } = useZkLogin();

  return (
    <>
      <div className="sticky top-0 w-full flex justify-evenly items-center bg-white py-3 px-5 z-40">
        <span className="text-opacity-90 text-[14px] text-[#4F4F4F]">[Mysten Blackjack] is provided for testnet purposes only and does not involve real money or the opportunity to win real money.</span>
      </div>
      <div className="grid grid-cols-6 mx-5 my-2">
        <div className="col-span-3 flex space-x-3 items-center">
          <Link href="/new" className="w-[min-content] md:w-[300px] text-2xl font-bold text-white">
            Mysten Blackjack
          </Link>
        </div>
        <div className="col-span-3 flex justify-end">
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
