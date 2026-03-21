// ClauseWall Service Worker for Push Notifications
// Plain JavaScript — NOT TypeScript

self.addEventListener("push", function (event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || "ClauseWall Deadline Reminder";
  var options = {
    body: data.body || "You have an upcoming contract deadline",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.tag || "deadline-reminder",
    renotify: true,
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  if (event.action === "dismiss") return;
  var url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(clients.openWindow(url));
});
