const cacheName = "thrsqr"
const filesToCache = [
  "/",
  "/images/icon_delete.png",
  "/images/thrsqrlogo.png",
  "/stylesheets/application.css",
  "/stylesheets/normalize.css",
  "/stylesheets/whitespace-reset.css",
  "/javascript/application.js",
  "/javascript/pwa.js",
]

this.addEventListener("install", event => {
  async function preCache() {
    let cache = await caches.open(cacheName);
    return cache.addAll(filesToCache);
  }
  event.waitUntil(preCache());
});