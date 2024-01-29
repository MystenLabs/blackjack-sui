import "server-only";

import React from "react";

export const HomePage = () => {
  console.log("HomePage.tsx is on the server:", !!process.env.IS_SERVER_SIDE);
  return (
    <div className="p-10 min-h-[60vh] text-center font-bold text-xl">
      This is the general home page
    </div>
  );
};
