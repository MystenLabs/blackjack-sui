import React, { useEffect } from "react";

export const useRegisterServiceWorker = () => {
  useEffect(() => {
    let serviceWorkerRegistration: any;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "Service worker registered. Scope is:",
            registration.scope
          );
          serviceWorkerRegistration = registration;
        })
        .catch((err) => {
          console.log("Service worker registration failed", err);
        });
    } else {
      console.log("Service worker not supported");
    }

    return () => {
      // Unregister the service worker when the component unmounts
      if (serviceWorkerRegistration) {
        serviceWorkerRegistration
          .unregister()
          .then(() => {
            console.log("Service worker unregistered.");
          })
          .catch((err: any) => {
            console.error("Error while unregistering service worker:", err);
          });
      }
    };
  }, []);
};
