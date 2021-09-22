/* eslint-disable max-len */
/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

const { getPrevious, slugFrom, countGoing, getNext, capitalize } = require("../lib/thrsqr");
const { notifySubscribers } = require("../lib/webpush");
// S3 IMPORT HERE

// responses reset after this time has passed after the start of an event
const WAIT_TIME_IN_MS = 1 * 60 * 60 * 1000;

module.exports = {

  async getNew(_req, res) {
    let store = res.locals.store;
    let eventId = await store.generateId("events");

    res.render("new-event", { eventId });
  },

  async edit(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    if (!event.logourl) event.logourl = "/images/thrsqrlogo-250.png";

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
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      // if latest update is older than last previous event reset responses.
      let previous = getPrevious(event.eventtime, event.dayofweek, event.utcoffset);
      // let lastUpdate = new Date(event.lastupdate);

      let now = new Date();

      if ((previous.valueOf() + WAIT_TIME_IN_MS) < now.valueOf()) {
        console.log("Resetting responses.");
        await store.resetResponses(eventId);
      }

      let responses = await store.getResponses(eventId);
      responses.forEach(response => {
        response.username = capitalize(response.username);
      });

      let nextEventTime = getNext(previous).valueOf();
      let going = countGoing(responses);
      let notGoing = responses.length - going;

      if (!event.logourl) event.logourl = "/images/thrsqrlogo-250.png";

      res.render("event", {
        event,
        responses,
        going,
        notGoing,
        nextEventTime
      });
    }
  },

  async postNew(req, res) {
    let email = req.body.email;
    let message = req.body.message;

    if (email.length > 0 || message.length > 0) {
      res.send("Thank you for registering.");

    } else {
      delete req.body.email;
      delete req.body.message;

      let store = res.locals.store;
      let eventDetails = { ...req.body };

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
    let endpoint = req.body.endpoint;

    let eventSub = await store.checkEventSub(eventId, endpoint);

    res.send(eventSub);
  },

  async subscribe(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let language = req.params.language;
    let subscription = req.body;

    await store.subscribeEvent(subscription, eventId, language);

    res.send("subscribed");
  },

  async unsubscribe(req, res) {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let endpoint = req.body.endpoint;

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

    await notifySubscribers(store, eventId, username, there, comment);

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

    await notifySubscribers(store, eventId);

    res.redirect(`/event/${eventId}`);
  }

};