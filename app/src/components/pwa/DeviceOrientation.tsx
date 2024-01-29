"use client";

import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import React from "react";
import { Button } from "../ui/button";

export const DeviceOrientation = () => {
  const {
    orientation,
    handleRequestOrientationPermission,
    canDetectOrientation,
  } = useDeviceOrientation();

  return (
    <div className="space-y-3">
      <div className="text-lg font-bold">Orientation:</div>
      <div>
        can detect orientation: {canDetectOrientation ? "true" : "false"}
      </div>
      <div>alpha: {orientation.alpha?.toFixed(2)}</div>
      <div>beta: {orientation.beta?.toFixed(2)}</div>
      <div>gamma: {orientation.gamma?.toFixed(2)}</div>
      <Button onClick={handleRequestOrientationPermission}>
        Request Access to device orientation
      </Button>
    </div>
  );
};
