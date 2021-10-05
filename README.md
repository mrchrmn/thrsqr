![ThrSqr logo](./public/images/thrsqrlogo-250.png)

# ThrSqr - Will you be there or be square?

## An RSVP tracker for weekly events and friendly people

So you and your group meet once a week, eg. five-a-side football, band or choir rehearsal, book club etc. _But only if enough people attend_ that is. As the event approaches, your WhatsApp group is flooded with "I'm going", "Not this week.", and - crucially - "So, are we enough, yet?!" messages. Every week the same ruckus.

Not any longer, thanks to ThrSqr!

[Click here](https://thrsqr.hrmn.dev) to see it in action and to actually use it like my football team and I have been doing for weeks now.

### Simple workflow

1. Set up your event,
2. share the link,
3. be there or be square,
4. read responses, or
5. get notified.

### Features

* URL based, no login required; session saves user's name / language for next visit
* Auto-resets responses one hour after the event has begun
* Dynamically generated webmanifest for each event
* Browser push notifications for individual events
  * Works with Chrome, Edge and Firefox on Android an Windows
* Individual event logos
  * which are also used in web manifest and notifications
* Time zone handling:
  * Saves browser timezone on event creation as event timezone. 
  * Displays event time, day of the week and date of next event according to browser timezone.
* English and German versions
* User-authentication protected master admin page to clean up events and users

### Technologies

* Node.js
* Express.js (view engine: Pug)
* PostgreSQL
* Web APIs:
  * Service Workers, Push, Notifications
* Heroku
* AWS S3
