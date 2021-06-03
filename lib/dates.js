/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

function lastOccurrence(timeString, dayOfWeek) {
  let eventDay = dayOfWeek;
  let eventHours = Number(timeString.split(":")[0]);
  let eventMinutes = Number(timeString.split(":")[1]);

  let now = new Date();

  let nowDay = now.getDay();
  let nowHours = now.getHours();
  let nowMinutes = now.getMinutes();

  let dateDelta;
  if (nowDay > eventDay) dateDelta = nowDay - eventDay;
  if (eventDay > nowDay) dateDelta = nowDay + 7 - eventDay;
  if (eventDay === nowDay) {
    if (nowHours < eventHours) {
      dateDelta = 7;

    } else if ((nowHours === eventHours) && (nowMinutes < eventMinutes)) {
      dateDelta = 7;

    } else {
      dateDelta = 0;
    }
  }

  let last = now;
  last.setDate(now.getDate() - dateDelta);
  last.setHours(eventHours);
  last.setMinutes(eventMinutes);

  return last;
}

module.exports = { lastOccurrence };