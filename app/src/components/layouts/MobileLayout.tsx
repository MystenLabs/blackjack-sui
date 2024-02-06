"use client";

import { useAuthentication } from "@/contexts/Authentication";
import React from "react";
import { AppBar } from "./navbars/Appbar";
import { ChildrenProps } from "@/types/ChildrenProps";
import { BottomNavbar } from "./navbars/BottomNavbar";
import { AppLogo } from "./navbars/AppLogo";

export const MobileLayout = ({ children }: ChildrenProps) => {
  const { user } = useAuthentication();

  return (
    <div
      className={`flex flex-col w-full min-h-screen relative role-${user.role}`}
    >
      <div className="flex-1 flex flex-col space-y-2 flex-1">
        <AppBar
          showBurger={false}
          onBurgerClick={() => {}}
          headerElement={<AppLogo className="!text-black" />}
        />
        <div className="p-2">{children}</div>
      </div>
      <BottomNavbar />
    </div>
  );
};
