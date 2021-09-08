"use strict";

function replaceTimeDate() {
  let locale = document.body.dataset.language === "en" ? "en-GB" : "de-DE";
  let nextDateSpan = document.getElementById("nextDate");

  if (nextDateSpan) {
    let eventTimeSpan = document.getElementById("eventTime");
    let eventDaySpan = document.getElementById("eventDay");

    let nextEventTime = nextDateSpan.parentElement.dataset.nexteventtime;
    let date = new Date(Number(nextEventTime));

    eventTimeSpan.innerHTML = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    eventDaySpan.innerHTML = date.toLocaleDateString(locale, { weekday: "long" });
    nextDateSpan.innerHTML = date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  }
}

function replaceTimeZone() {
  let eventTimeZone = document.getElementById("eventTimeZone");
  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (eventTimeZone) {
    eventTimeZone.value = timeZone;
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
  replaceTimeDate();
  setDeleteAlerts();
  replaceTimeZone();
});