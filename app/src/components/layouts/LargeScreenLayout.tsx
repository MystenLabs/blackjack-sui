"use client";

import { ChildrenProps } from "@/types/ChildrenProps";
import React from "react";
import { InfoIcon } from "./InfoIcon";
import { TopNavbar } from "./TopNavbar";

export const LargeScreenLayout = ({ children }: ChildrenProps) => {

  return (
    <div className="relative w-full h-screen flex-col">
      <TopNavbar/>
      <div className="flex-1 p-4 bg-grey-100">
        <div className="max-w-[1300px] mx-auto">{children}</div>
      </div>
      <InfoIcon/>
    </div>
  );
};
