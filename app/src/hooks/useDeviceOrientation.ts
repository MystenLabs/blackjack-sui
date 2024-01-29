"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DeviceOrientation = {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
};

export const useDeviceOrientation = () => {
  const [canDetectOrientation, setCanDetectOrientation] = useState(false);

  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });

  const handleRequestOrientationPermission = () => {
    if (!canDetectOrientation) {
      toast.error("Install the app to detect orientation");
      return;
    }

    if (
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((permissionState: PermissionState) => {
          if (permissionState === "granted") {
            window.addEventListener(
              "deviceorientation",
              (event: DeviceOrientationEvent) => {
                const { alpha, beta, gamma } = event;
                setOrientation({
                  alpha: event.alpha,
                  beta: event.beta,
                  gamma: event.gamma,
                });
              }
            );
          } else {
            toast.error(
              "Device orientation related features will not be supported"
            );
          }
        })
        .catch(console.error);
    } else {
      console.log(typeof (DeviceOrientationEvent as any).requestPermission);
      toast.error("Device orientation Not supported in the browser");
    }
  };

  useEffect(() => {
    setCanDetectOrientation("DeviceOrientationEvent" in window);
  }, []);

  return {
    orientation,
    handleRequestOrientationPermission,
    canDetectOrientation,
  };
};
