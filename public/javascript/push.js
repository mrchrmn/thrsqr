/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

"use strict";

import { urlBase64ToUint8Array } from "/javascript/base64.mjs";
import { texts } from "/locale/texts.mjs";

// eslint-disable-next-line no-undef
const TEXTS = texts[language];


// SERVICE WORKER

async function registerServiceWorker() {
  try {
    let registration = await navigator.serviceWorker.register("/service-worker.js");
    return registration;

  } catch (error) {
    console.log("Unable to register service worker:\n" + error);
    return null;
  }
}


// SUBSCRIPTION HANDLING

const publicVapidKey = 'BJlwITZQd9mrnKedh07Tze13WtSSaqfTzeKT5xx4qpDFzxhHgS4vqbGm_XlAELasf1cCuAU5L9us46GkhOHOyOU';

async function subscribe(registration) {
  try {
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    } else {
      throw new Error("Permission not granted.");
    }

  } catch (error) {
    console.log("Unable to subscribe to push notification:\n" + error);
    return null;
  }
}

async function unsubscribe(registration) {
  try {
    let subscription = await registration.pushManager.getSubscription();
    return await subscription.unsubscribe();

  } catch (error) {
    console.log("Unable to unsubscribe from notifications:\n" + error);
    return null;
  }
}


// HELPER

function getEventId() {
  let path = window.location.pathname;
  if (path.startsWith("/event/")) return path.split("/")[2];
  return null;
}


function canPush() {
  if (!("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)) {
    console.log("This browser does not support push notifications.");
    return null;
  }

  if (Notification.permission === "denied") {
    console.log("The user has denied all push notifications from ThrSqr.");
    return null;
  }

  return true;
}


function createSubLink(parent, text) {
  let p = document.createElement("P");
  let a = document.createElement("A");
  a.setAttribute("href", "#");
  a.innerHTML = text;

  parent.appendChild(p);
  p.appendChild(a);
  return a;
}


function removeChildren(parent) {
  while (parent.lastChild) {
    parent.lastChild.remove();
  }
}


// SUBSCRIPTION UI

async function handleSubLinks(registration) {

  if (!canPush()) return null;

  let subsSection = document.getElementById("subscriptions");

  if (subsSection) {

    subsSection.style.display = "none";
    removeChildren(subsSection);

    let eventId = getEventId();
    let subscription = await registration.pushManager.getSubscription();

    // On event page with no prior subscriptions
    if (!subscription && eventId) {
      subsSection.style.display = "block";

      let subLink = createSubLink(subsSection, TEXTS.subscribeEvent);

      subLink.addEventListener("click", async event => {
        event.preventDefault();
        let subscription = await subscribe(registration);
        await subscribeEvent(subscription, eventId);
        await handleSubLinks(registration);
      });
    }

    if (subscription) {
      subsSection.style.display = "block";

      if (eventId) {
        let eventSubbed = await isEventSubbed(subscription, eventId);

        if (eventSubbed) {
          let unsubLink = createSubLink(subsSection, TEXTS.unsubscribeEvent);

          unsubLink.addEventListener("click", async event => {
            event.preventDefault();
            await unsubscribeEvent(subscription, eventId);
            await handleSubLinks(registration);
          });

        } else {
          let subLink = createSubLink(subsSection, TEXTS.unsubscribeEvent);

          subLink.addEventListener("click", async event => {
            event.preventDefault();
            await subscribeEvent(subscription, eventId);
            await handleSubLinks(registration);
          });
        }

      let unsubAllLink = createSubLink(subsSection, TEXTS.unsubscribeAll);

      unsubAllLink.addEventListener("click", async event => {
        event.preventDefault();
        await unsubscribeAll();
        await unsubscribe(registration);
        await handleSubLinks(registration);
      });
    }
  }

  return true;
}


// LET'S GO!

document.addEventListener("DOMContentLoaded", async () => {
  let registration = await registerServiceWorker();
  await handleSubLinks(registration);
});