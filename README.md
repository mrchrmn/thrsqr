# ThrSqr
An rsvp tracker for weekly events and friendly people.
(My first web app. Hooray!)

### Simple workflow

1. Set up event, 
2. share the link,
3. leave name to vote, 
4. read responses. 

### Features

* URL based, no login required
* Remembers user on browser
  * Users can change their mind or change their comment.
* Somewhat timezone aware
  * Registers and saves client time zone as event time zone.
  * Uses event time zone to reset responses one hour after the event has begun.
* Master admin page

### Currently built on the NEPP stack ;)

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
