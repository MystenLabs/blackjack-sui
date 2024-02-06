"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useNotifications } from "@/hooks/useNotifications";

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const { refreshServiceWorker } = useNotifications();

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("got into event listener");
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the deferredPrompt for later use
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Show the browser's install prompt
      (deferredPrompt as any).prompt();
      // Wait for the user to respond
      (deferredPrompt as any).userChoice.then((choiceResult: any) => {
        console.log({ choiceResult });
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
          refreshServiceWorker();
        } else {
          console.log("User dismissed the install prompt");
        }
        // Reset the deferredPrompt
        setDeferredPrompt(null);
      });
    }
  };

  return (
    <Button
      onClick={handleInstallClick}
      style={{ display: deferredPrompt ? "block" : "none" }}
    >
      Install App
    </Button>
  );
};
