/* eslint-disable max-len */
/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

const { getPrevious, countGoing, getNext, capitalize, getResizedLogoURL } = require("../lib/thrsqr");
const { notifySubscribers } = require("../lib/webpush");
const config = require("../lib/config");

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

    if (!event.logourl) {
      event.logourl = "/images/thrsqrlogo-250.png";
    } else {
      event.logourl = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 250);
    }

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
      let lastUpdate = new Date(event.lastupdate);

      let now = new Date();

      if ( (now.valueOf() > (previous.valueOf() + WAIT_TIME_IN_MS)) &&
           (lastUpdate.valueOf() < (previous.valueOf() + WAIT_TIME_IN_MS)) ) {
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
      let icons = {
        "144": "/images/thrsqrlogo-250.png",
        "192": "/images/thrsqrlogo-250.png",
        "256": "/images/thrsqrlogo-250.png",
        "512": "/images/thrsqrlogo-250.png"
      };

      if (!event.logourl) {
        event.logourl = "/images/thrsqrlogo-250.png";
      } else if (event.logourl.startsWith("https")) {
        event.logourl = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 500);
        icons[144] = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 144);
        icons[192] = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 192);
        icons[256] = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 256);
        icons[512] = getResizedLogoURL(config.S3_BUCKET_NAME, eventId, 512);
      }

      req.session.event = event;

      res.set("Cache-Control", "no-cache");
      res.render("event", {
        event,
        icons,
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

      res.render("new-event-success", { ...eventDetails, origin: req.headers.origin });
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