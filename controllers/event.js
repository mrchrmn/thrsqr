/* eslint-disable max-len */
/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

const { getLast, slugFrom, countGoing, getNext } = require("../lib/thrsqr");

// responses reset after this time has passed after the start of an event
const WAIT_TIME_IN_MS = 1 * 60 * 60 * 1000;

module.exports = {

  async edit(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      res.render("edit-event", {
        event
      });
    }
  },

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

      if (previous.valueOf() > (lastUpdate.valueOf() + WAIT_TIME_IN_MS)) {
        console.log("Resetting responses.");
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
  },

  async new(req, res) {
    let email = req.body.email;
    let message = req.body.message;

    if (email.length > 0 || message.length > 0) {
      res.status(200).send("Thank you for registering.");

    } else {
      delete req.body.email;
      delete req.body.message;

      let store = res.locals.store;
      let eventId = await store.generateId("events");
      let eventDetails = { ...req.body, eventId };

      await store.newEvent(eventDetails);
      let slug = slugFrom(eventDetails.eventTitle);

      res.render("new-event-success", { ...eventDetails, origin: req.headers.origin, slug });
    }
  },

  async update(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let eventDetails = { ...req.body, eventId };

    await store.updateEvent(eventDetails);
    res.redirect(`/event/${eventId}`);
  },

  async checkSub(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let endpoint = req.body;

    let eventSub = await store.checkSub(eventId, endpoint);

    if (!eventSub) {
      res.send(0);
    } else {
      res.send(1);
    }
  },

  async subscribeEvent(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let subscription = JSON.parse(req.body);

    await store.subscribeEvent(subscription, eventId);

    res.send("subscribed");
  },

  async unsubscribeEvent(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let endpoint = req.body;

    await store.unsubscribeEvent(endpoint, eventId);

    res.send("unsubscribed");
  },

  async updateResponses(req, res) {
    let store = res.locals.store;
    let participantId = res.locals.participantId;
    let eventId = req.params.eventId;
    let username = req.body.username;
    let comment = req.body.comment;
    let there = !!Number(req.params.there);

    if (!participantId || !await store.ifExists(participantId, "participants")) {
      participantId = await store.newParticipant(username);
    }

    await store.updateResponses(eventId, username, there, participantId, comment);

    req.session.participantId = participantId;
    req.session.username = username;
    req.session.lastComment = comment;
    res.redirect(`/event/${eventId}`);
  },

  async removeResponse(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let participantId = req.params.participantId;

    await store.removeResponse(eventId, participantId);

    res.redirect(`/event/${eventId}`);
  }

};