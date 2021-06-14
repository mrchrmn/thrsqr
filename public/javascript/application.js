"use strict";

function replaceTimeZone() {
  let eventTimeZone = document.getElementById("eventTimeZone");
  if (eventTimeZone) {
    eventTimeZone.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}

function setDeleteAlerts() {
  let forms = document.querySelectorAll("form.delete");
  forms.forEach(form => {
    form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();
      if (confirm("Are you sure? This cannot be undone!")) {
        event.target.submit();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setDeleteAlerts();
  replaceTimeZone();
});