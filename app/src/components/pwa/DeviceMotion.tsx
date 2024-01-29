"use client";

import React from "react";
import { Button } from "../ui/button";
import { useDeviceMotion } from "@/hooks/useDeviceMotion";

export const DeviceMotion = () => {
  const { motion, handleRequestMotionPermission, canDetectMotion } =
    useDeviceMotion();

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Motion:</div>
      <div>can detect motion: {canDetectMotion ? "true" : "false"}</div>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="text-lg font-bold">Rotation via Motion</div>
          <div>alpha: {Math.round(motion.rotationRate?.alpha || 0)}</div>
          <div>beta: {Math.round(motion.rotationRate?.beta || 0)}</div>
          <div>gamma: {Math.round(motion.rotationRate?.gamma || 0)}</div>
        </div>
        <div className="space-y-3">
          <div className="text-lg font-bold">Acceleration via Motion</div>
          <div>x: {Math.round(motion.acceleration?.x || 0)}</div>
          <div>y: {Math.round(motion.acceleration?.y || 0)}</div>
          <div>z: {Math.round(motion.acceleration?.z || 0)}</div>
        </div>
      </div>

      <Button onClick={handleRequestMotionPermission}>
        Request Access to device orientation
      </Button>
    </div>
  );
};
