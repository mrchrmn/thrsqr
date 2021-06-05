"use strict";

function replaceTimeZone() {
  document.getElementById("eventTimeZone").value = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

document.addEventListener("DOMContentLoaded", () => {
  replaceTimeZone();
});