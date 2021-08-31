/* eslint-disable max-len */
"use strict";

const cacheName = "thrsqr";
const filesToCache = [
  "/",
  "/images/icon_delete.png",
  "/images/thrsqrlogo.png",
  "/stylesheets/application.css",
  "/stylesheets/normalize.css",
  "/stylesheets/whitespace-reset.css",
  "/javascript/application.js",
  "/javascript/push.js",
  "/fonts/BioRhyme-Bold-webfont.woff",
  "/fonts/BioRhyme-Light-webfont.woff",
  "/fonts/BioRhyme-Regular-webfont.woff",
  "/fonts/stylesheet.css"
];

// this.addEventListener("install", event => {
//   async function preCache() {
//     try {
//       let cache = await caches.open(cacheName);
//       return cache.addAll(filesToCache);

//     } catch (error) {
//       console.log("Could not install/cache:\n", error);
//       return null;
//     }
//   }
//   event.waitUntil(preCache());
// });

// this.addEventListener("activate", async () => {
//   try {
//     let keys = await caches.keys();
//     await Promise.all(
//       keys.map(key => {
//         if (key !== cacheName) {
//           console.log("[ServiceWorker] - Removing old cache:", key);
//           return caches.delete(key);
//         } else return null;
//       })
//     );
//     return keys;

//   } catch (error) {
//     console.log("Could not activate:\n", error);
//     return null;
//   }
// });

// this.addEventListener("fetch", event => {
//   event.respondWith((async () => {
//     try {
//       let cachedResponse = await caches.match(event.request, { ignoreSearch: true });
//       return cachedResponse || fetch(event.request);

//     } catch (error) {
//       console.log("Could not fetch:\n", error);
//       return null;
//     }
//   })());
// });