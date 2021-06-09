CREATE TABLE events (
  id char(8) PRIMARY KEY,
  title varchar(100) NOT NULL,
  dayOfWeek int NOT NULL,
  eventTime time NOT NULL,
  timeZone varchar NOT NULL,
  info varchar(150), 
  lastUpdate timestamptz DEFAULT now()
);

CREATE TABLE participants (
  id char(8) PRIMARY KEY,
  username varchar(50),
  lastUpdate timestamptz DEFAULT now()
);

CREATE TABLE responses (
  id serial PRIMARY KEY,
  event_id char(8) REFERENCES events (id) ON DELETE CASCADE, 
  participant_id char(8) REFERENCES participants (id) ON DELETE CASCADE, 
  there boolean NOT NULL,
  comment varChar(150)
);

CREATE TABLE admins (
  id serial PRIMARY KEY,
  username char(16) NOT NULL,
  password text NOT NULL
);

DELETE FROM responses;
DELETE FROM events;
DELETE FROM participants;