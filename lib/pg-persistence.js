const { dbQuery } = require("./db-query");
// const bcrypt = require("bcrypt");
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async isValidId(id) {
    const CHECK_ID = "SELECT id FROM events WHERE id = $1";
    let result = await dbQuery(CHECK_ID, id);
    if (result.rowCount === 0) return true;
    return false;
  }
  
  async generateEventId() {
    let id;

    do {
      id = "";
      for (let position = 0; position < 8; position += 1) {
        id += ALPHABET[Math.floor(Math.random() * 62)];
      }   
    } while (!(await this.isValidId(id)));

    return id;
  }

  async newEvent(details) {
    const NEW_EVENT = "INSERT INTO events (id, title, dayOfWeek, eventTime, timeZone, info) VALUES ($1, $2, $3, $4, $5, $6)";
    let result = await dbQuery(NEW_EVENT, details.eventId, details.eventTitle, details.eventDayOfWeek, details.eventTime, details.eventTimeZone, details.eventInfo);
    return result.rowCount > 0;
  }

  async getEvent(id) {
    const FIND_EVENT = "SELECT * FROM events WHERE id = $1";
    let result = await dbQuery(FIND_EVENT, id);
    console.log(result.rows[0]);
    return result.rows[0];
  }

  async getParticipants(id) {
    const FIND_PEOPLE = "SELECT * FROM participants WHERE event_id = $1";
    let result = await dbQuery(FIND_PEOPLE, id);
    console.log(result.rows);
    return result.rows;
  }

};