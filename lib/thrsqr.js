/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

function getPrevious(timeString, dayOfWeek, utcOffset) {
  let offsetHours = utcOffset.hours || 0;
  let offsetMinutes = utcOffset.minutes || 0;

  let eventHours = Number(timeString.split(":")[0]) - offsetHours;
  let eventMinutes = Number(timeString.split(":")[1]) - offsetMinutes;

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


function getNext(date) {
  let nextDate = new Date (date.valueOf());
  nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  return nextDate;
}


function countGoing(responses) {
  return responses.filter(response => response.there === true).length;
}

function capitalize(string) {
  return string[0].toUpperCase() + string.slice(1);
}

module.exports = { getPrevious, getNext, slugFrom, countGoing, capitalize };