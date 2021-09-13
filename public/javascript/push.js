/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

"use strict";

import { urlBase64ToUint8Array } from "/javascript/base64.mjs";
import { texts } from "/locale/texts.mjs";

let lang;
let TEXTS;


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


// BROWSER SUBSCRIPTION HANDLING

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


// DATABASE FETCHES

async function subFetcher(subscription, path) {
  try {
    let res = await fetch(path, {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "content-type": "application/json"
      }
    });
    return res;
  } catch (error) {
    console.log(`Could not perform subscribe operation at path ${path}`, error);
    return null;
  }
}


async function isEventSubbed(subscription, eventId) {
  try {
    let res = await subFetcher(subscription, `/event/${eventId}/check-sub`);
    let body = await res.json();
    return body;
  } catch (error) {
    console.log("Could not check subscription:\n", error);
    return null;
  }
}


// SUBSCRIPTION UI

async function handleSubLinks(registration) {

  let subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    let unsubAllLink = document.createElement("A");
    unsubAllLink.setAttribute("href", "#");
    unsubAllLink.innerHTML = TEXTS.unsubscribeAll;

    let unsubAllElement = document.getElementById("unsubscribeAll");
    removeChildren(unsubAllElement);

    unsubAllElement.appendChild(unsubAllLink);
    unsubAllElement.style.display = "list-item";

    unsubAllLink.addEventListener("click", async event => {
      event.preventDefault();

      await subFetcher(subscription, "/unsubscribe-all");
      await unsubscribe(registration);
      await handleSubLinks(registration);
    });

  }

  let subsSection = document.getElementById("subscriptions");

  if (subsSection) {

    subsSection.style.display = "none";
    removeChildren(subsSection);

    let eventId = getEventId();

    if (eventId) {
      subsSection.style.display = "block";

      let eventSubbed = await isEventSubbed(subscription, eventId);

      if (eventSubbed === true) {
        let unsubLink = createSubLink(subsSection, TEXTS.unsubscribeEvent);

        unsubLink.addEventListener("click", async event => {
          event.preventDefault();

          await subFetcher(subscription, `/event/${eventId}/unsubscribe`);
          await handleSubLinks(registration);
        });

      } else {
        let subLink = createSubLink(subsSection, TEXTS.subscribeEvent);

        subLink.addEventListener("click", async event => {
          event.preventDefault();

          await subFetcher(subscription, `/event/${eventId}/subscribe/${lang}`);
          await handleSubLinks(registration);
        });
      }
    }
  }

  return true;
}


// LET'S GO!

if (canPush()) {
  document.addEventListener("DOMContentLoaded", async () => {
    lang = document.body.dataset.language;
    TEXTS = texts[lang];

    let registration = await registerServiceWorker();
    await handleSubLinks(registration);
  });
}

