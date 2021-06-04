/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

// Returns the date of the last occurrence of a weekly event
function getLastOrNext(timeString, dayOfWeek, lastOrNext) {
  let eventDay = dayOfWeek;
  let eventHours = Number(timeString.split(":")[0]);
  let eventMinutes = Number(timeString.split(":")[1]);

  let now = new Date();

  let nowDay = now.getDay();
  let nowHours = now.getHours();
  let nowMinutes = now.getMinutes();

  let dateDelta;


  if (nowDay > eventDay) dateDelta =  lastOrNext === "last" ? nowDay - eventDay : 7 - nowDay + eventDay;
  if (eventDay > nowDay) dateDelta =  lastOrNext === "last" ? nowDay + 7 - eventDay : eventDay - nowDay;
  if (eventDay === nowDay) {
    if (nowHours < eventHours) {
      dateDelta = lastOrNext === "last" ? 7 : 0;

    } else if ((nowHours === eventHours) && (nowMinutes < eventMinutes)) {
      dateDelta = lastOrNext === "last" ? 7 : 0;

    } else {
      dateDelta = lastOrNext === "last" ? 0 : 7;
    }
  }

  let date = now;
  console.log(dateDelta);
  date.setHours(eventHours);
  date.setMinutes(eventMinutes);
  if (lastOrNext === "last") {
    date.setDate(now.getDate() - dateDelta);
  } else {
    date.setDate(now.getDate() + dateDelta);
  }

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


module.exports = { getLastOrNext, slugFrom, countGoing };