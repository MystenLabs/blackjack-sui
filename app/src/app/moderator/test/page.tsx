import "server-only";

import { Paper } from "@/components/general/Paper";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Test Page for Moderators",
};

const TestModeratorPage = () => {
  console.log(
    "Test moderator page is on server:",
    !!process.env.IS_SERVER_SIDE
  );
  return (
    <div className="text-center">
      Test Moderator Page as an example of authenticated routing
    </div>
  );
};

export default TestModeratorPage;
