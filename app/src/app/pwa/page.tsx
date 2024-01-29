import "server-only";

import { InstallPWA } from "@/components/pwa/InstallPWA";
import { Paper } from "@/components/general/Paper";
import React from "react";
import { DeviceMotion } from "@/components/pwa/DeviceMotion";
import { Notifications } from "@/components/pwa/Notifications";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PWA Functionalities Showcase",
};

const PWAShowcasePage = () => {
  console.log("PWA showcase page is on server:", !!process.env.IS_SERVER_SIDE);
  return (
    <Paper className="space-y-7">
      <div className="text-lg font-bold">PWA Functionalities</div>
      <div>This template is not a simple web app, it is a PWA, meaning:</div>
      <ul className="list-disc pl-4">
        <li>It is installable in your device</li>
        <li>It provides push notifications</li>
        <li>It provides access to device orientation</li>
      </ul>
      <InstallPWA />
      <hr />
      <Notifications />
      <hr />
      <DeviceMotion />
    </Paper>
  );
};

export default PWAShowcasePage;
