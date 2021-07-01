const https = require("https");

/*
options = {
  url: "thrsqr.herokuapp.com",
  minutes: 27,
  start: 7,
  end: 24
}
*/

function validTime(start, end) {
  let now = new Date();

  if (end > start) {
    if (now.getHours() >= start && now.getHours() < end) {
      return true;
    }
  }

  if (end < start) {
    if (now.getHours() >= start || now.getHours() < end) {
      return true;
    }
  }

  return false;
}


function stayAwake(options) {
  let milliseconds = options.minutes * 60 * 1000;

  if (validTime(options.start, options.end)) {
    setTimeout(() => {
      try {
        https.get(options.url);
        console.log("Getting URL.");
      } catch (error) {
        console.log("Error getting URL: " + error);
      } finally {
        stayAwake(options);
      }
    }, milliseconds);
  }
}

module.exports = stayAwake;
