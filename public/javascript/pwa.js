async function registerServiceWorker() {
  try {
    let registration = await navigator.serviceWorker.register("/javascript/service-worker.js");
    console.log("Service worker successfully registered:\n" + registration);
  } catch (error) {
    console.log("Unable to register service worker:\n" + error);
  }
}

if ("serviceWorker" in navigator) {
  registerServiceWorker();
} else {
  console.log("Service Worker not supported.");
}
