![ThrSqr logo](./public/images/thrsqrlogo.png)

# ThrSqr - Will you be there or be square?
An RSVP tracker for weekly events and friendly people.
[Click here](https://thrsqr.herokuapp.com) to see it in action and use it.

### Simple workflow

1. Set up event, 
2. share the link,
3. leave name to vote, 
4. read responses. 

### Features

* URL based, no login required
* Dynamically generated webmanifest for each event
* Somewhat timezone aware
  * Registers and saves client time zone as event time zone.
  * Uses event time zone to reset responses one hour after the event has begun.
* Master admin page to clean up events and users

### Built with

* Node.js
* Express
* PostgreSQL
* Pug
 
### On the todo list

* More client side code:
  * Database updates without page reloads
  * Turn into SPA?
* Nicer interface
  * Possibility to upload event logos
  * Colour palette from event logos
