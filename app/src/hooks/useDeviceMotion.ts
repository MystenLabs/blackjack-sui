import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DeviceMotion = {
  acceleration: DeviceMotionEventAcceleration | null;
  accelerationIncludingGravity: DeviceMotionEventAcceleration | null;
  rotationRate: DeviceMotionEventRotationRate | null;
  interval: number | null;
};

export const useDeviceMotion = () => {
  const [canDetectMotion, setCanDetectMotion] = useState(false);
  const [motion, setMotion] = useState<DeviceMotion>({
    acceleration: null,
    accelerationIncludingGravity: null,
    rotationRate: null,
    interval: null,
  });

  const handleRequestMotionPermission = () => {
    if (!canDetectMotion) {
      toast.error("Install the app to detect motion");
      return;
    }

    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      (DeviceMotionEvent as any).requestPermission()
        .then((permissionState: PermissionState) => {
          if (permissionState === "granted") {
            window.addEventListener(
              "devicemotion",
              (event: DeviceMotionEvent) => {
                const {
                  acceleration,
                  accelerationIncludingGravity,
                  rotationRate,
                  interval,
                } = event;
                setMotion({
                  acceleration,
                  accelerationIncludingGravity,
                  rotationRate,
                  interval,
                });
              }
            );
          } else {
            toast.error("Device motion related features will not be supported");
          }
        })
        .catch(console.error);
    } else {
      toast.error("Device motion Not supported in the browser");
    }
  };

  useEffect(() => {
    setCanDetectMotion("DeviceMotionEvent" in window);
  }, []);

  return {
    motion,
    handleRequestMotionPermission,
    canDetectMotion,
  };
};
