"use client";

import { ChildrenProps } from "@/types/ChildrenProps";
import React from "react";
import { InfoIcon } from "./InfoIcon";
import { TopNavbar } from "./TopNavbar";

export const LargeScreenLayout = ({ children }: ChildrenProps) => {

  return (
    <div className="static w-full h-full flex-col">
      <TopNavbar/>
      <div className="relative flex-1 p-4">
        <div className="max-w-[1300px] mx-auto">{children}</div>
      </div>
      <InfoIcon/>
    </div>
  );
};
