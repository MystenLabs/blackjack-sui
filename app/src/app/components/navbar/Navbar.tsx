"use client";

import Link from "next/link";
import { ConnectButton } from "@mysten/wallet-kit";
import { usePathname, useRouter } from "next/navigation";
import { useGetNavigations } from "@/app/hooks/useGetNavigations";
import React from "react";

export const Navbar = () => {
  const pathname = usePathname();
  const { navigations } = useGetNavigations();
  console.log(pathname);

  return (
    <div className="flex justify-between items-center p-[8px] h-[60px] border-b-gray-400 border-b-[1px] sticky top-0">
      <div className="flex justify-start items-center gap-[14px]">
          <h1 className="text-3xl font-bold mb-3">Sui Blackjack!</h1>
        {/*{navigations.map(({ title, href }) => (*/}
        {/*  <Link*/}
        {/*    key={href}*/}
        {/*    className={`text-lg font-weight-500 ${*/}
        {/*      pathname === href ? "underline" : ""*/}
        {/*    }`}*/}
        {/*    href={href}*/}
        {/*  >*/}
        {/*    {title}*/}
        {/*  </Link>*/}
        {/*))}*/}
      </div>
      <ConnectButton />
    </div>
  );
};
