const { getLast, slugFrom, countGoing, getNext } = require("../lib/thrsqr");

// responses reset after this time has passed after the start of an event
const WAIT_TIME_IN_MS = 1 * 60 * 60 * 1000;

module.exports = {

  async display(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let locale = req.headers["accept-language"].substring(0,5);
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      // if latest update is older than last previous event reset responses.
      let previous = getLast(event.eventtime, event.dayofweek, event.utcoffset);
      let lastUpdate = new Date(event.lastupdate); 
      if (previous.valueOf() + WAIT_TIME_IN_MS > lastUpdate.valueOf()) {
        await store.resetResponses(eventId);
      }

      let responses = await store.getResponses(eventId);
      if (req.session.language === "de") locale = "de-DE";
      let nextDate = getNext(event.eventtime, event.dayofweek, event.utcoffset).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
      let going = countGoing(responses);
      let notGoing = responses.length - going;
      
      res.render("event", {
        event,
        responses,
        going,
        notGoing,
        nextDate
      });
    }
  }
}