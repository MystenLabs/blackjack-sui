import "server-only";

import { Paper } from "@/components/general/Paper";
import { HomePage } from "@/components/home/HomePage";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "PoC Template for Members",
};

const MemberHomePage = () => {
  console.log("Member Home Page is on server:", !!process.env.IS_SERVER_SIDE);
  return <HomePage />;
};

export default MemberHomePage;
