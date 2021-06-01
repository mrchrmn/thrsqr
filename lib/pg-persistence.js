const { dbQuery } = require("./db-query");
// const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }
  
  async idExists(id, table) {
    const CHECK_ID = "SELECT id FROM %I WHERE id = %L";
    let result = await dbQuery(CHECK_ID, table, id);
    if (result.rowCount === 0) return false;
    return true;
  }
  
  async generateId(table) {
    let id;

    do {
      id = "";
      for (let position = 0; position < 8; position += 1) {
        id += ALPHABET[Math.floor(Math.random() * 62)];
      }   
    } while (await this.idExists(id, table));

    return id;
  }

  async newEvent(details) {
    const NEW_EVENT = "INSERT INTO events (id, title, dayOfWeek, eventTime, timeZone, info) VALUES (%L, %L, %s, %L, %L, %L)";
    let result = await dbQuery(NEW_EVENT, details.eventId, details.eventTitle, details.eventDayOfWeek, details.eventTime, details.eventTimeZone, details.eventInfo);
    return result.rowCount > 0;
  }

  async newParticipant(username) {
    let id = await this.generateId("participants");
    const NEW_PARTICIPANT = "INSERT INTO participants (id, username) VALUES (%L, %L)";
    await dbQuery(NEW_PARTICIPANT, id, username);
    return id;
  }

  async getEvent(id) {
    const FIND_EVENT = "SELECT * FROM events WHERE id = %L";
    let result = await dbQuery(FIND_EVENT, id);
    return result.rows[0];
  }

  async getParticipants(id) {
    const FIND_PEOPLE = "SELECT there, username FROM participants AS p JOIN events_participants AS ep ON p.id = ep.participant_id WHERE event_id = %L";
    let result = await dbQuery(FIND_PEOPLE, id);
    return result.rows;
  }

  async hasVoted(eventId, participantId) {
    const FIND_VOTE = "SELECT * FROM events_participants WHERE event_id = %L AND participant_id = %L";
    let result = await dbQuery(FIND_VOTE, eventId, participantId);
    return result.rowCount > 0;
  }

  async updateEventsParticipants(eventId, username, there, participantId) {
    if (await this.hasVoted(eventId, participantId)) {
      const UPDATE_VOTE = "UPDATE events_participants SET there = %L WHERE participant_id = %L AND event_id = %L";
      await dbQuery(UPDATE_VOTE, there, participantId, eventId);
      const UPDATE_NAME = "UPDATE participants SET username = %L WHERE id = %L";
      await dbQuery(UPDATE_NAME, username, participantId);
    } else {
      const NEW_VOTE = "INSERT INTO events_participants (event_id, participant_id, there) VALUES (%L, %L, %L)";
      await dbQuery(NEW_VOTE, eventId, participantId, there);
      const UPDATE_NAME = "UPDATE participants SET username = %L WHERE id = %L";
      await dbQuery(UPDATE_NAME, username, participantId);
    }
  }
};