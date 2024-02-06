import "server-only";

import { Paper } from "@/components/general/Paper";
import { OwnedObjects } from "@/components/ownedObjects/OwnedObjects";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owned Objects",
};

const OwnedObjectsPage = () => {
  console.log("Owned Objects Page is on server:", !!process.env.IS_SERVER_SIDE);
  return (
    <Paper>
      <OwnedObjects />
    </Paper>
  );
};

export default OwnedObjectsPage;
