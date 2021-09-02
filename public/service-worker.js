/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */
"use strict";

// ###### PUSH NOTIFICATIONS

self.addEventListener("push", event => {
  if (event.data) {
    let data = event.data.json();

    let title = data.title;
    let body = `There: ${data.going}, Square: ${data.notGoing}\n`;

    if (data.username) {
      let there = data.there ? "there" : "square";
      body += `${data.username} will be ${there}.`;
    }

    let options = {
      body: body,
      icon: "/android-chrome-192x192.png",
      tag: "thrsqr",
      renotify: true,
      vibrate: [67, 33, 67],
      data: {
        clickURL: `/event/${data.eventId}`
      }
    };
    console.log("Trying to show notification:", title, body);
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.preventDefault();
  event.notification.close();
  // eslint-disable-next-line no-undef
  event.waitUntil(clients.openWindow(event.notification.data.clickURL));
});