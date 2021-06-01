CREATE TABLE events (
  id char(8) PRIMARY KEY,
  title text NOT NULL,
  dayOfWeek int NOT NULL,
  eventTime time NOT NULL,
  timeZone varchar NOT NULL,
  info text
);

CREATE TABLE participants (
  id serial PRIMARY KEY,
  event_id char(8) REFERENCES events (id),
  username text NOT NULL,
  there boolean NOT NULL
);