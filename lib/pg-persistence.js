const { dbQuery } = require("./db-query");
// const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const WAIT_TIME_IN_MS = 1 * 60 * 60 * 1000;

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
    await dbQuery(NEW_EVENT, 
                  details.eventId, 
                  details.eventTitle, 
                  details.eventDayOfWeek, 
                  details.eventTime, 
                  details.eventTimeZone, 
                  details.eventInfo);
  }

  async newParticipant(username) {
    let id = await this.generateId("participants");
    const NEW_PARTICIPANT = "INSERT INTO participants (id, username) VALUES (%L, %L)";
    await dbQuery(NEW_PARTICIPANT, id, username);
    return id;
  }


  async lastOccurrence(eventId) {
    const GET_TIMEDAY = "SELECT eventtime, dayofweek FROM events WHERE id = %L"
    let result = await dbQuery(GET_TIMEDAY, eventId);

    let eventDay = result.rows[0].dayofweek;
    let eventHours = Number(result.rows[0].eventtime.split(":")[0]);
    let eventMinutes = Number(result.rows[0].eventtime.split(":")[1]);

    let now = new Date();

    let nowDay = now.getDay();
    let nowHours = now.getHours();
    let nowMinutes = now.getMinutes();
    
    let dateDelta;
    if (nowDay > eventDay) dateDelta = nowDay - eventDay;
    if (eventDay > nowDay) dateDelta = nowDay + 7 - eventDay;
    if (eventDay === nowDay) {
      if (nowHours < eventHours) dateDelta = 7;
      else if ((nowHours === eventHours) && (nowMinutes < eventMinutes)) dateDelta = 7;
      else dateDelta = 0;
    }

    let last = now;
    last.setDate(now.getDate() - dateDelta);
    last.setHours(eventHours);
    last.setMinutes(eventMinutes);

    return last;
  }


  async lastUpdate(eventId) {
    const GET_LAST = "SELECT lastupdate FROM events WHERE id = %L";
    let result = await dbQuery(GET_LAST, eventId);
    return new Date(result.rows[0].lastupdate);
  }


  async getEvent(id) {
    let lastOccurrence = this.lastOccurrence(id);
    let lastUpdate = this.lastUpdate(id);

    let dates = await Promise.all([lastOccurrence, lastUpdate]);

    if (dates[0].valueOf() > dates[1].valueOf() + WAIT_TIME_IN_MS) {
      await this.resetResponses(id);
    }

    const FIND_EVENT = "SELECT * FROM events WHERE id = %L";
    let result = await dbQuery(FIND_EVENT, id);
    return result.rows[0];
  }


  async getParticipants(eventId) {
    const FIND_PEOPLE = "SELECT p.id, there, username FROM participants AS p JOIN responses AS ep ON p.id = ep.participant_id WHERE event_id = %L";
    let result = await dbQuery(FIND_PEOPLE, eventId);
    return result.rows;
  }


  async hasResponded(eventId, participantId) {
    const FIND_RESPONSE = "SELECT * FROM responses WHERE event_id = %L AND participant_id = %L";
    let result = await dbQuery(FIND_RESPONSE, eventId, participantId);
    return result.rowCount > 0;
  }


  async updateResponses(eventId, username, there, participantId) {
    if (await this.hasResponded(eventId, participantId)) {
      const UPDATE_RESPONSE = "UPDATE responses SET there = %L WHERE participant_id = %L AND event_id = %L";
      await dbQuery(UPDATE_RESPONSE, there, participantId, eventId);

    } else {
      const NEW_RESPONSE = "INSERT INTO responses (event_id, participant_id, there) VALUES (%L, %L, %L)";
      await dbQuery(NEW_RESPONSE, eventId, participantId, there);
    }

    const UPDATE_NAME = "UPDATE participants SET username = %L WHERE id = %L";
    await dbQuery(UPDATE_NAME, username, participantId);

    const UPDATE_LAST = "UPDATE events SET lastupdate = now() WHERE id = %L";
    await dbQuery(UPDATE_LAST, eventId);
}


  async removeResponse(eventId, participantId) {
    const REMOVE_RESPONSE = "DELETE FROM responses WHERE event_id = %L AND participant_id = %L";
    await dbQuery(REMOVE_RESPONSE, eventId, participantId);
  }

  async resetResponses(eventId) {
    const RESET_RESPONSES = "DELETE FROM responses WHERE event_id = %L";
    await dbQuery(RESET_RESPONSES, eventId);
  }
};