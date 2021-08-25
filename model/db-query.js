// generic database query function, takes SQL statement and parameters

const config = require("../lib/config");
const { Client } = require("pg");
const format = require("pg-format");

function logQuery(statement, parameters) {
  let timeStamp = new Date();
  let formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
}

const isProduction = (config.NODE_ENV === "production");
const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false
};


module.exports = {
  async dbQuery(statement, ...parameters) {
    let sql = format(statement, ...parameters);
    let client = new Client(CONNECTION);

    await client.connect();
    logQuery(sql);
    let result = await client.query(sql);
    await client.end();

    return result;
  }
}