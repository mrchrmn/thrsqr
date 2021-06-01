const { dbQuery } = require("./db-query");
// const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }
  
  async isValidId(id, table) {
    const CHECK_ID = "SELECT id FROM %I WHERE id = %L";
    let result = await dbQuery(CHECK_ID, table, id);
    if (result.rowCount === 0) return true;
    return false;
  }
  
  async generateId(table) {
    let id;

    do {
      id = "";
      for (let position = 0; position < 8; position += 1) {
        id += ALPHABET[Math.floor(Math.random() * 62)];
      }   
    } while (!(await this.isValidId(id, table)));

    return id;
  }

  async newEvent(details) {
    const NEW_EVENT = "INSERT INTO events (id, title, dayOfWeek, eventTime, timeZone, info) VALUES (%L, %L, %s, %L, %L, %L)";
    let result = await dbQuery(NEW_EVENT, details.eventId, details.eventTitle, details.eventDayOfWeek, details.eventTime, details.eventTimeZone, details.eventInfo);
    return result.rowCount > 0;
  }

  async getEvent(id) {
    const FIND_EVENT = "SELECT * FROM events WHERE id = %L";
    let result = await dbQuery(FIND_EVENT, id);
    return result.rows[0];
  }

  async getParticipants(id) {
    const FIND_PEOPLE = "SELECT there, username FROM participants AS p JOIN events_participants AS ep ON p.id = ep.event_id WHERE event_id = %L";
    let result = await dbQuery(FIND_PEOPLE, id);
    return result.rows;
  }

  // async updateParticipants(eventId, username, there, userId) {
  //   if (userId) {
  //     const UPDATE = "UPDATE participants SET "
  //   }    
  // }

};