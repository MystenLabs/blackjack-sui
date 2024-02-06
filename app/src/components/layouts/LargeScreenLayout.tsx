"use client";

import { ChildrenProps } from "@/types/ChildrenProps";
import React, { useState } from "react";
import { SideNavbar } from "./navbars/SideNavbar";
import { AppBar } from "./navbars/Appbar";
import { useAuthentication } from "@/contexts/Authentication";
import { TopNavbar } from "./navbars/TopNavbar";
import { BreadCrumbs } from "../breadcrumbs/BreadCrumbs";

// if true => top appbar will be used in large screen
// if false => side appbar will be used in large screen
const NAVBAR_WIDTH = 350;

export const LargeScreenLayout = ({ children }: ChildrenProps) => {
  const { user } = useAuthentication();
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);

  const handleOpenNavbar = () => {
    setIsNavbarOpen(true);
  };

  const handleCloseNavbar = () => {
    setIsNavbarOpen(false);
  };

  if (process.env.NEXT_PUBLIC_USE_TOP_NAVBAR_IN_LARGE_SCREEN === "1") {
    return (
      <div className={`relative w-full h-full role-${user.role} flex-col`}>
        <TopNavbar />
        <div className="flex-1 p-4 bg-grey-100">
          <div className="max-w-[1300px] mx-auto">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full role-${user.role}`}>
      <SideNavbar
        isOpen={isNavbarOpen}
        onClose={handleCloseNavbar}
        width={NAVBAR_WIDTH}
      />
      <div
        className="flex-1 flex flex-col space-y-2"
        style={{
          width: `calc(100% - ${NAVBAR_WIDTH}px)`,
        }}
      >
        <AppBar
          headerElement={<BreadCrumbs />}
          showBurger={!isNavbarOpen}
          onBurgerClick={handleOpenNavbar}
        />
        <div className="p-4 bg-grey-100">
          <div className="max-w-[1300px] mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};
