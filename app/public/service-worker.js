const installEvent = () => {
  self.addEventListener("install", () => {
    console.log("service worker installed");
  });
};
installEvent();

const activateEvent = () => {
  self.addEventListener("activate", () => {
    console.log("service worker activated");
  });
};
activateEvent();

self.addEventListener("message", (event) => {
  console.log("messaeg received in service worker", event);
  if (event.data && event.data.type === "custom-push") {
    // Handle custom push event
    const customPushData = event.data.payload;
    // Generate a notification using the custom data
    const notificationOptions = {
      body: customPushData.body,
      icon: customPushData.icon,
      badge: customPushData.badge,
      data: {
        url: customPushData.url,
      },
      actions: [
        {
          action: "custom-action",
          title: "Custom Action",
        },
        {
          action: "custom-action-2",
          title: "Custom Action 2",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        customPushData.title,
        notificationOptions
      )
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked.");
  event.notification.close();
  console.log("aaaaaa");

  console.log(event.notification.data);

  event.waitUntil(
    clients.openWindow(event.notification.data.url).then((windowClient) => {
      if (windowClient) {
        // Window was successfully opened and focused
        windowClient.focus();
        console.log("Window opened and focused.");
      } else {
        // Failed to open the window
        console.error("Failed to open the window.");
      }
    })
  );
});
