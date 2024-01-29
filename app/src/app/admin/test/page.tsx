import "server-only";

import { Paper } from "@/components/general/Paper";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Test Page for Admins",
};

const TestAdminPage = () => {
  console.log("Test Admin Page is on server:", !!process.env.IS_SERVER_SIDE);
  return (
    <div className="text-center">
      Test Admin Page as an example of authenticated routing
    </div>
  );
};

export default TestAdminPage;
