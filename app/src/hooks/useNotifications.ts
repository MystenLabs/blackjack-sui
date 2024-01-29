import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SendNotificationProps {
  title: string;
  body?: string;
  url?: string;
  actions?: NotificationAction[];
}

export const useNotifications = () => {
  const [canReceiveNotifications, setCanReceiveNotifications] = useState(false);
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [hasGivenPermission, setHasGivenPermission] = useState(false);

  useEffect(() => {
    setCanReceiveNotifications("Notification" in window);
    setHasServiceWorker("serviceWorker" in navigator);
  }, []);

  useEffect(() => {
    if (canReceiveNotifications) {
      setHasGivenPermission(
        Notification.permission === "granted" ||
          localStorage.getItem("notificationsPermission") === "granted"
      );
    }
  }, [canReceiveNotifications]);

  const handleRequestNotificationPermission = () => {
    if (!canReceiveNotifications) {
      toast.error("Install the app to receive notifications");
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        // User has granted permission
        console.log("Notification permission granted");
        localStorage.setItem("notificationsPermission", "granted");
        refreshServiceWorker();
      } else if (permission === "denied") {
        // User has denied permission
        console.log("Notification permission denied");
      } else {
        // Permission request ignored
        console.log("Notification permission ignored");
      }
    });
  };

  const sendNotification = ({
    title = "PoC Template NextJS",
    body = "This is a test notification",
    url = "/",
    actions = [],
  }: SendNotificationProps) => {
    if (!canReceiveNotifications) {
      toast.error("Notifications not supported here...");
    }

    const customPushData = {
      title,
      body,
      icon: "/MystenLabs_Vertical_Logo_White.svg",
      badge: "/MystenLabs_Vertical_Logo_White.svg",
      url,
    };

    if ("serviceWorker" in navigator && "MessageChannel" in window) {
      console.log("let's see...");
      console.log(navigator.serviceWorker?.controller);
      navigator.serviceWorker?.controller?.postMessage({
        type: "custom-push",
        payload: customPushData,
      });
    }
  };

  const sendTestNotification = () => {
    sendNotification({
      title: "PoC Template NextJS",
      body: "Open this notification to be redirected to the home page",
      actions: [],
    });
  };

  const refreshServiceWorker = () => {
    window.location.reload();
  };

  return {
    canReceiveNotifications,
    hasGivenPermission,
    hasServiceWorker,
    sendNotification,
    sendTestNotification,
    handleRequestNotificationPermission,
    refreshServiceWorker,
  };
};
