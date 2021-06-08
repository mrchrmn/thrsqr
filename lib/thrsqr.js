/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

function offsetStringFrom(number) {
  let offsetString = number < 0 ? "-" : "+";
  offsetString += String(number).padStart(2, "0");
  offsetString += ":00";
  return offsetString;
}

function getLast(timeString, dayOfWeek, utcOffset) {
  let eventHours = Number(timeString.split(":")[0]) - utcOffset;
  let eventMinutes = Number(timeString.split(":")[1]);
  let eventDay = eventHours < 0 ? dayOfWeek - 1 : dayOfWeek;
  eventHours = (24 + eventHours) % 24;

  let now = new Date();

  let nowDay = now.getUTCDay();
  let nowHours = now.getUTCHours();
  let nowMinutes = now.getUTCMinutes();

  let dateDelta = (nowDay - eventDay + 7) % 7;

  if (dateDelta === 0) {
    if ((nowHours < eventHours) || 
        ((nowHours === eventHours) && (nowMinutes < eventMinutes))) {
      dateDelta = 7;
    }
  }

  let date = now;
  date.setUTCHours(eventHours);
  date.setUTCMinutes(eventMinutes);
  date.setUTCDate(now.getUTCDate() - dateDelta);

  return date;
}

function getNext(timeString, dayOfWeek, utcOffset) {
  let date = getLast(timeString, dayOfWeek, utcOffset);
  date.setUTCDate(date.getUTCDate() + 7);
  return date;
}

function slugFrom(string) {
  return string.match(/[a-zA-Z0-9öäüÖÄÜß ]/g)
               .join("")
               .replace(/ /g , "-")
               .replace(/ä/g, "ae")
               .replace(/ö/g, "oe")
               .replace(/ü/g, "ue")
               .replace(/ß/g, "ss")
               .replace(/Ä/g, "Ae")
               .replace(/Ö/g, "Oe")
               .replace(/Ü/g, "Ue")
               .toLowerCase();
}

function countGoing(responses) {
  return responses.filter(response => response.there === true).length;
}


module.exports = { getLast, getNext, slugFrom, countGoing };