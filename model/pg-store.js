const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

module.exports = class PgStore {
  constructor() {
  }

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

  // Add new participant to database and return their id
  async newParticipant(username) {
    let id = await this.generateId("participants");
    const NEW_PARTICIPANT = "INSERT INTO participants (id, username) VALUES (%L, %L)";
    await dbQuery(NEW_PARTICIPANT, id, username);
    return id;
  }

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

  // Retrieve responses for given event
  async getResponses(eventId) {
    const FIND_RESPONSES = "SELECT p.id AS part_id, there, username, comment FROM participants AS p JOIN responses AS ep ON p.id = ep.participant_id WHERE event_id = %L ORDER BY username ASC";
    let result = await dbQuery(FIND_RESPONSES, eventId);
    return result.rows;
  }

  // Check whether a participant has already responded
  async hasResponded(eventId, participantId) {
    const FIND_RESPONSE = "SELECT * FROM responses WHERE event_id = %L AND participant_id = %L";
    let result = await dbQuery(FIND_RESPONSE, eventId, participantId);
    return result.rowCount > 0;
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