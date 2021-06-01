/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const config = require("./lib/config");
const express = require("express");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const { persistence } = require("./lib/get-config");
const Persistence = require(persistence);
const catchError = require("./lib/catch-error");


const app = express();
const HOST = config.HOST;
const PORT = config.PORT;
const LokiStore = store(session);


// authentication check middleware
// const requiresAdmin = (_req, res, next) => {
//   if (!res.locals.admin) {
//     res.redirect(302, "/admin/signin");
//   } else {
//     next();
//   }
// };


app.set("view engine", "pug");
app.set("views", "./views");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 365 * 24 * 3600000,
    path: "/",
    secure: false
  },
  name: "there-or-square-session-id",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({})
}));

app.use(flash());


// Create a new datastore
app.use((req, res, next) => {
  res.locals.store = new Persistence(req.session);
  next();
});


// Extract session datastore
app.use((req, res, next) => {
  res.locals.admin = req.session.admin;
  res.locals.username = req.session.username;
  res.locals.participantId = req.session.participantId;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});


// Welcome page
app.get("/", (_req, res) => {
  res.render("welcome");
});


// Create new event
app.get("/event/new", (_req, res) => {
  res.render("new-event");
});


// Successfully registered new event
app.post("/event/new",
  [
    body("eventTitle")
      .trim()
      .isLength({ min: 1})
      .withMessage("You need to provide a title.")
      .isLength({ max: 100 })
      .withMessage("Title cannot be longer than 100 characters."),

    body("eventInfo")
      .trim()
      .isLength({ max: 150 })
      .withMessage("Info cannot be longer than 150 characters.")
  ], 
  catchError(
    async (req, res) => {
      let store = res.locals.store;
      let eventId = await store.generateId("events");
      let eventDetails = { ...req.body, eventId };

      let created = await store.newEvent(eventDetails);
      if (!created) throw new Error("There was a problem creating the event.");

      res.render("new-event-success", { ...eventDetails, origin: req.headers.origin });
    }
  )
);


// Display event page
app.get("/event/:eventId", catchError(
  async (req, res) => {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      let participants = await store.getParticipants(eventId);
      res.render("event", {
        event,
        participants,
        username: res.locals.username,
        participantId: res.locals.participant
      });
    }
  }
));


// 
app.post("/event/:eventId/:there", 
  [
    body("username")
      .trim()
      .isLength({ min: 1})
      .withMessage("You need to provide a name.")
      .isLength({ max: 50 })
      .withMessage("Name cannot be longer than 50 characters.")
  ], 
  catchError(
    async (req, res) => {
      let store = res.locals.store;
      let participantId = res.locals.participantId;
      let eventId = req.params.eventId;
      let username = req.body.username;
      let there = !!Number(req.params.there);

      if (!participantId) {
        participantId = await store.newParticipant(username);
      }

      await store.updateEventsParticipants(eventId, username, there, participantId);

      req.session.participantId = participantId;
      req.session.username = username;
      req.flash("success", "Event updated.");
      res.redirect(`/event/${eventId}`);
    }
  )
);


// Error handler
app.use((err, _req, res, _next) => {
  console.log(err);
  res.status(404)
     .send(err.message);
});

// Listener
app.listen(PORT, HOST, () => {
  console.log(`There Or Square listening on port ${PORT} of ${HOST}.`);
});