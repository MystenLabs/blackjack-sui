"use client";

import { useNotifications } from "@/hooks/useNotifications";
import React from "react";
import { Button } from "../ui/button";

export const Notifications = () => {
  const {
    sendTestNotification,
    handleRequestNotificationPermission,
    hasGivenPermission,
    canReceiveNotifications,
  } = useNotifications();

  return (
    <div className="space-y-5">
      <div className="text-lg font-bold">Notifications</div>
      <div>
        can receive notifications: {canReceiveNotifications ? "true" : "false"}
      </div>
      {!hasGivenPermission && (
        <Button
          onClick={handleRequestNotificationPermission}
          variant={"default"}
          className="mr-2"
        >
          Wanna receive notifications?
        </Button>
      )}
      <Button onClick={sendTestNotification} variant={"default"}>
        Send test notification
      </Button>
    </div>
  );
};
