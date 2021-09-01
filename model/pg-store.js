const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

module.exports = class PgStore {
  constructor() {
  }

  // ###### Helpers ######

  // Check whether an id exists in a given table
  async ifExists(id, table) {
    const CHECK_ID = "SELECT id FROM %I WHERE id = %L";
    let result = await dbQuery(CHECK_ID, table, id);
    if (result.rowCount === 0) return false;
    return true;
  }

  // Generate random 4-character id from base62 alphabet
  async generateId(table) {
    let id;

    do {
      id = "";
      for (let position = 0; position < 4; position += 1) {
        id += ALPHABET[Math.floor(Math.random() * 62)];
      }
    } while (await this.ifExists(id, table));

    return id;
  }


  // ###### Events ######

  // Retrieve event information
  async getEvent(id) {
    const FIND_EVENT = "SELECT * FROM events WHERE id = %L";
    const FIND_OFFSET = "SELECT utc_offset FROM pg_timezone_names WHERE name = %L";
    let event = await dbQuery(FIND_EVENT, id);
    if (event.rowCount !== 0) {
      let utcOffset  = await dbQuery(FIND_OFFSET, event.rows[0].timezone);
      event.rows[0].utcoffset = utcOffset.rows[0].utc_offset.hours;
      event.rows[0].id = event.rows[0].id.trim();
      return event.rows[0];
    } else {
      return false;
    }
  }

  // Save new event to database
  async newEvent(details) {
    const NEW_EVENT = "INSERT INTO events (id, title, dayOfWeek, eventTime, timeZone, info) VALUES (%L, %L, %s, %L, %L, %L)";
    await dbQuery(NEW_EVENT,
                  details.eventId,
                  details.eventTitle,
                  details.eventDayOfWeek,
                  details.eventTime,
                  details.eventTimeZone,
                  details.eventInfo);
  }

  // Update event details in database
  async updateEvent(details) {
    const UPDATE_EVENT = "UPDATE events SET title = %L, dayOfWeek = %L, eventTime = %L, info = %L, lastupdate = now() WHERE id = %L";
    await dbQuery(UPDATE_EVENT,
                  details.eventTitle,
                  details.eventDayOfWeek,
                  details.eventTime,
                  details.eventInfo,
                  details.eventId);
  }


  // ###### Subscriptions ######

  // Checks for entry in subscriptions
  async checkSub(endpoint) {
    const FIND_SUB = "SELECT * FROM subscriptions WHERE endpoint = %L";
    let sub = await dbQuery(FIND_SUB, endpoint);
    if (sub.rowCount !== 0) return true;
    return false;
  }

  // Checks whether event is subscribed by current subscription
  async checkEventSub(eventId, endpoint) {
    const FIND_EVENT_SUB = "SELECT * FROM events_subscriptions WHERE event_id = %L AND subscription_endpoint = %L";
    let eventSub = await dbQuery(FIND_EVENT_SUB, eventId, endpoint);
    if (eventSub.rowCount !== 0) return true;
    return false;
  }

  // Adds event subscription, adds subscription entry if none yet
  async subscribeEvent(subscription, eventId) {
    if (!(await this.checkSub(subscription.endpoint))) {
      console.log("No sub yet");
      const NEW_SUB = "INSERT INTO subscriptions (endpoint, expirationTime, p256dh, auth) VALUES (%L, %L, %L, %L)";
      await dbQuery(NEW_SUB,
                    subscription.endpoint,
                    subscription.expirationTime,
                    subscription.keys.p256dh,
                    subscription.keys.auth);
    }

    const SUBSCRIBE_TO_EVENT = "INSERT INTO events_subscriptions (event_id, subscription_endpoint) VALUES (%L, %L)";
    await dbQuery(SUBSCRIBE_TO_EVENT, eventId, subscription.endpoint);
  }

  // Removes event subscription, leaves subscriptions table untouched
  async unsubscribeEvent(endpoint, eventId) {
    const UNSUB_FROM_EVENT = "DELETE FROM events_subscriptions WHERE event_id = %L and subscription_endpoint = %L";
    await dbQuery(UNSUB_FROM_EVENT, eventId, endpoint);
  }

  async unsubscribeAll(endpoint) {
    const REMOVE_SUB = "DELETE FROM subscriptions WHERE endpoint = %L";
    await dbQuery(REMOVE_SUB, endpoint);
  }


  // ###### Participants and Responses ######

  // Add new participant to database and return their id
  async newParticipant(username) {
    let id = await this.generateId("participants");
    const NEW_PARTICIPANT = "INSERT INTO participants (id, username) VALUES (%L, %L)";
    await dbQuery(NEW_PARTICIPANT, id, username);
    return id;
  }

  // Check whether a participant has already responded
  async hasResponded(eventId, participantId) {
    const FIND_RESPONSE = "SELECT * FROM responses WHERE event_id = %L AND participant_id = %L";
    let result = await dbQuery(FIND_RESPONSE, eventId, participantId);
    return result.rowCount > 0;
  }

  // Retrieve responses for given event
  async getResponses(eventId) {
    const FIND_RESPONSES = "SELECT p.id AS part_id, there, username, comment FROM participants AS p JOIN responses AS ep ON p.id = ep.participant_id WHERE event_id = %L ORDER BY username ASC";
    let result = await dbQuery(FIND_RESPONSES, eventId);
    return result.rows;
  }

  // Update responses, username and last update
  async updateResponses(eventId, username, there, participantId, comment) {
    if (await this.hasResponded(eventId, participantId)) {
      const UPDATE_RESPONSE = "UPDATE responses SET there = %L, comment = %L WHERE participant_id = %L AND event_id = %L";
      await dbQuery(UPDATE_RESPONSE, there, comment, participantId, eventId);

    } else {
      const NEW_RESPONSE = "INSERT INTO responses (event_id, participant_id, there, comment) VALUES (%L, %L, %L, %L)";
      await dbQuery(NEW_RESPONSE, eventId, participantId, there, comment);
    }

    const UPDATE_NAME = "UPDATE participants SET username = %L WHERE id = %L";
    await dbQuery(UPDATE_NAME, username, participantId);

    const SET_LASTUPDATE_EVENT = "UPDATE events SET lastupdate = now() WHERE id = %L";
    await dbQuery(SET_LASTUPDATE_EVENT, eventId);

    const SET_LASTUPDATE_USER = "UPDATE participants SET lastupdate = now() WHERE id = %L";
    await dbQuery(SET_LASTUPDATE_USER, participantId);
}

  // Remove a response from responses table
  async removeResponse(eventId, participantId) {
    const REMOVE_RESPONSE = "DELETE FROM responses WHERE event_id = %L AND participant_id = %L";
    await dbQuery(REMOVE_RESPONSE, eventId, participantId);
  }

  // Delete all responses for an event.
  async resetResponses(eventId) {
    const RESET_RESPONSES = "DELETE FROM responses WHERE event_id = %L";
    await dbQuery(RESET_RESPONSES, eventId);

    const SET_LASTUPDATE_EVENT = "UPDATE events SET lastupdate = now() WHERE id = %L";
    await dbQuery(SET_LASTUPDATE_EVENT, eventId);
  }


  // ###### Superuser ######

  // check for user authentication
  async userAuthenticated(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT password FROM admins WHERE username = %L";
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async deleteInactiveEvents() {
    const OLD_EVENTS = "DELETE FROM events WHERE lastupdate < NOW() - INTERVAL '90 days'";
    await dbQuery(OLD_EVENTS);
  }

  async deleteInactiveParticipants() {
    const OLD_PARTICIPANTS = "DELETE FROM participants WHERE lastupdate < NOW() - INTERVAL '180 days'";
    await dbQuery(OLD_PARTICIPANTS);
  }
};