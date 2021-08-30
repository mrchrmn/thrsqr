CREATE TABLE events (
  id varchar(8) PRIMARY KEY,
  title varchar(100) NOT NULL,
  dayOfWeek int NOT NULL,
  eventTime time NOT NULL,
  timeZone varchar NOT NULL,
  info varchar(303), 
  lastUpdate timestamptz DEFAULT now()
);

CREATE TABLE participants (
  id varchar(8) PRIMARY KEY,
  username varchar(50),
  lastUpdate timestamptz DEFAULT now()
);

CREATE TABLE responses (
  id serial PRIMARY KEY,
  event_id varchar(8) REFERENCES events (id) ON DELETE CASCADE, 
  participant_id varchar(8) REFERENCES participants (id) ON DELETE CASCADE, 
  there boolean NOT NULL,
  comment varChar(150)
);

CREATE TABLE admins (
  id serial PRIMARY KEY,
  username varchar(16) NOT NULL,
  password text NOT NULL
);

CREATE TABLE subscriptions (
  endpoint text PRIMARY KEY,
  expirationTime int,
  p256dh text NOT NULL,
  auth text NOT NULL
);

CREATE TABLE events_subscriptions (
  id serial PRIMARY KEY,
  event_id varchar(8) REFERENCES events (id) ON DELETE CASCADE,
  subscription_endpoint text REFERENCES subscriptions (endpoint) ON DELETE CASCADE
);

DELETE FROM responses;
DELETE FROM events;
DELETE FROM participants;
DELETE FROM subscriptions;
DELETE FROM events_subscriptions: