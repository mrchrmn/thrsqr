/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
"use strict";

import { texts } from "/locale/texts.mjs";

let lang;
let TEXTS;

async function replaceTimeDate() {
  let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let abbrev;

  try {
    let response = await fetch("/timezone-abbrev", {
      method: "POST",
      body: JSON.stringify({ timezone }),
      headers: {
        "content-type": "application/json"
      }
    });
    abbrev = await response.text() || "";

  } catch (error) {
    console.log(`Could not get timezone abbreviaton: `, error);
  }

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

    if (lang === "en") {
      let localTimezoneSpan = document.getElementById("localTimezone");
      localTimezoneSpan.innerHTML = `(${abbrev})`;
    }
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

function removeResponseHandler() {
  let responseLinks = document.querySelectorAll("#responses a");
  responseLinks.forEach(link => {
    let form = link.parentElement.parentElement;
    link.addEventListener("click", event => {
      event.preventDefault();
      if (confirm(TEXTS.confirmRemoveResponse)) {
        form.submit();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  lang = document.body.dataset.language;
  TEXTS = texts[lang];

  replaceTimeDate();
  setDeleteAlerts();
  replaceTimeZone();
  removeResponseHandler();
});