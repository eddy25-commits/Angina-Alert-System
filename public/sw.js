self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = event.data && event.data.json ? event.data.json() : null;
  const title = payload?.title || "HeartLink";
  const body = payload?.body || "A trusted contact needs your attention.";
  const url = payload?.data?.url || "/app";

  const options = {
    body,
    tag: "heartlink-alert",
    data: { url },
    requireInteraction: true,
    actions: [{ action: "open", title: "Open alert" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/app", self.location.origin).toString();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl || client.url === targetUrl + "/") {
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});
