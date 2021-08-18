/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */
const config = require("./lib/config");
const Persistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");

const express = require("express");
const flash = require("express-flash");
const { body, validationResult } = require("express-validator");

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

const { getLast, slugFrom, countGoing, getNext } = require("./lib/thrsqr");
const TEXTS = require("./lib/texts.json");
// const stayAwake = require("./lib/stay-awake");

const app = express();
const HOST = config.HOST;
const PORT = config.PORT;
//  const LokiStore = store(session);

// responses can still be read and updated until this time after the start of an event
const WAIT_TIME_IN_MS = 1 * 60 * 60 * 1000; 

// SignIn check middleware
const adminOnly = (req, res, next) => {
  if (!res.locals.superuser) {
    res.redirect(302, "/superusersignin");
  } else {
    next();
  }
};

app.set("view engine", "pug");
app.set("views", "./views");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));


// Session setup
const isProduction = (config.NODE_ENV === "production");

let sessionConfig = {
  cookie: {
    httpOnly: true,
    maxAge: 180 * 24 * 3600000,
    path: "/", 
    secret: false
  },
  name: "thrsqr-session-id",
  resave: false,
  saveUninitialized: false,
  secret: config.SECRET,
  store: new pgSession({
    conObject: {
      connectionString: config.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false
    }
  })
}

if (isProduction) {
  app.set("trust proxy", 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));



app.use(flash());


// Create a new datastore
app.use((_req, res, next) => {
  res.locals.store = new Persistence();
  next();
});


app.use((req, res, next) => {
  if (!req.session.language) {
    req.session.language = req.headers["accept-language"].substring(0,2);
  }

  if (req.session.language === "de") {
    res.locals.TEXTS = TEXTS["de"];
  } else {
    res.locals.TEXTS = TEXTS["en"];
  }

  next();
})


// Extract session datastore
app.use((req, res, next) => {
  res.locals.superuser = req.session.superuser;
  res.locals.username = req.session.username;
  res.locals.participantId = req.session.participantId;
  res.locals.lastComment = req.session.lastComment;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});


// GET handlers

// Webmanifest

app.get("/site/webmanifest/:eventId", catchError(
  async (req, res) => {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    let eventManifest = "";

    if (event) eventManifest = `{
"name": "${event.title}",
"short_name": "${event.title}",
"icons": [
    {
        "src": "/android-chrome-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "/android-chrome-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
],
"theme_color": "#c8f3c8",
"background_color": "#174117",
"display": "standalone",
"start_url": "/event/${event.id}",
"description": "ThrSqr - Your RSVP tracker for weekly events and friendly people."
}`;

    res.append("Content-Type", "text/html").send(eventManifest);
  }
));

// Welcome page
app.get("/", (_req, res) => {
  res.render("welcome");
});


// Create new event
app.get("/event/new", (_req, res) => {
  res.render("new-event");
});


// Edit existing event
app.get("/event/edit/:eventId", catchError(
  async (req, res) => {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      res.render("edit-event", {
        event
      });
    }
}));


// Redirect from title slug to event
app.get("/event/:slug/:eventId", (req, res) => {
  res.redirect(303, `/event/${req.params.eventId}`);
});


// Display event page
app.get("/event/:eventId", catchError(
  async (req, res) => {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let locale = req.headers["accept-language"].substring(0,5);
    let event = await store.getEvent(eventId);

    if (!event) {
      throw new Error("Requested event not found.");
    } else {
      // if latest update is older than last previous event reset responses.
      let previous = getLast(event.eventtime, event.dayofweek, event.utcoffset);
      let lastUpdate = new Date(event.lastupdate); 
      if (previous.valueOf() + WAIT_TIME_IN_MS > lastUpdate.valueOf()) {
        await store.resetResponses(eventId);
      }

      let responses = await store.getResponses(eventId);
      if (req.session.language === "de") locale = "de-DE";
      let nextDate = getNext(event.eventtime, event.dayofweek, event.utcoffset).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
      let going = countGoing(responses);
      let notGoing = responses.length - going;
      
      res.render("event", {
        event,
        responses,
        going,
        notGoing,
        nextDate
      });
    }
  }
));


// Deletes user session data
app.get("/reset/user", (req, res) => {
  delete req.session.superuser;
  delete req.session.username;
  delete req.session.participantId;
  delete req.session.lastComment;
  delete req.session.language;

  res.redirect(req.headers.referer);
});


// Swap German and English via session
app.get("/change-language", (req, res) => {
  req.session.language = req.session.language === "en" ? "de" : "en";
  res.redirect(req.headers.referer);
});


// Sign in as admin
app.get("/superusersignin", (_req, res) => {
  res.locals.TEXTS = TEXTS["en"];
  res.render("signin");
});


app.get("/superuser", adminOnly, (_req, res) => {
  res.locals.TEXTS = TEXTS["en"];
  res.render("superuser");
});


// POST handlers

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
      .isLength({ max: 300 })
      .withMessage("Info cannot be longer than 300 characters.")
  ], 
  catchError(
    async (req, res) => {
      let email = req.body.email;
      let message = req.body.message;

      if (email.length > 0 || message.length > 0) {
        res.status(200).send("Thank you for registering.");
      
      } else {
        delete req.body.email;
        delete req.body.message;
  
        let store = res.locals.store;
        let eventId = await store.generateId("events");
        let eventDetails = { ...req.body, eventId };
  
        let errors = validationResult(req);
  
        if (!errors.isEmpty()) {
          errors.array().forEach(message => req.flash("error", message.msg));
          res.render("new-event", {
            flash: req.flash()
          });
  
        } else {
          await store.newEvent(eventDetails);
          let slug = slugFrom(eventDetails.eventTitle);

          let successView;
          if (req.session.language === "de") {
            successView = "new-event-success-de";
          } else {
            successView = "new-event-success";
          }

          res.render(successView, { ...eventDetails, origin: req.headers.origin, slug });  
        }  
      }
    }
  )
);


// Update existing event details
app.post("/event/edit/:eventId",
  [
    body("eventTitle")
      .trim()
      .isLength({ min: 1})
      .withMessage("You need to provide a title.")
      .isLength({ max: 100 })
      .withMessage("Title cannot be longer than 100 characters."),

    body("eventInfo")
      .trim()
      .isLength({ max: 300 })
      .withMessage("Info cannot be longer than 300 characters.")
  ], 
  catchError(
    async (req, res) => {
      let store = res.locals.store;
      let eventId = req.params.eventId;
      let eventDetails = { ...req.body, eventId };

      let errors = validationResult(req);

      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.render("edit-event", {
          flash: req.flash()
        });

      } else {
        await store.updateEvent(eventDetails);
        res.redirect(`/event/${eventId}`);          
      }
    }
  )
);


// Update responses (there or square)
app.post("/event/:eventId/:there", 
  [
    body("username")
      .trim()
      .isLength({ min: 1})
      .withMessage("You need to provide a name.")
      .isLength({ max: 50 })
      .withMessage("Name cannot be longer than 50 characters."),

    body("comment")
      .trim()
      .isLength({ max: 150 })
      .withMessage("Comment cannot be longer than 150 characters.")
  ], 
  catchError(
    async (req, res) => {
      let store = res.locals.store;
      let participantId = res.locals.participantId;
      let eventId = req.params.eventId;
      let username = req.body.username;
      let comment = req.body.comment;
      let there = !!Number(req.params.there);

      let errors = validationResult(req);
      
      if (!errors.isEmpty()) {
        errors.array().forEach(message => req.flash("error", message.msg));
        res.redirect(`/event/${eventId}`);
      } else {
        if (!participantId || ! await store.ifExists(participantId, "participants")) {
          participantId = await store.newParticipant(username);
        }
  
        await store.updateResponses(eventId, username, there, participantId, comment);
  
        req.session.participantId = participantId;
        req.session.username = username;
        req.session.lastComment = comment;
        res.redirect(`/event/${eventId}`);          
      }
    }
  )
);


// Remove response
app.post("/event/:eventId/remove/:participantId", catchError(
  async (req, res) => {
    let store = res.locals.store;
    let eventId = req.params.eventId;
    let participantId = req.params.participantId;

    await store.removeResponse(eventId, participantId);

    res.redirect(`/event/${eventId}`);
  }
));


// Signing in
app.post("/superusersignin", catchError(
  async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    let authenticated = await res.locals.store.userAuthenticated(username, password)
    res.locals.TEXTS = TEXTS["en"];

    if (!authenticated) {
      req.flash("error", "Invalid credentials.");
      res.render("signin", {
        flash: req.flash(),
        username
      });
    } else {
      req.session.superuser = true;
      res.redirect("/superuser");
    }
  }
));


// Deleting inactive events or participants
app.post("/superuser/delete-inactive-events", adminOnly, catchError(
  async (_req, res) => {
    await res.locals.store.deleteInactiveEvents();
    res.redirect("/superuser");
  }));

app.post("/superuser/delete-inactive-participants", adminOnly, catchError(
  async (_req, res) => {
    await res.locals.store.deleteInactiveParticipants();
    res.redirect("/superuser");
  }));





// Error handler
app.use((err, _req, res, _next) => {
  console.log(err);
  res.status(404)
     .send(err.message);
});

// Listener
app.listen(PORT, HOST, () => {
  console.log(`ThrSqr listening on port ${PORT} of ${HOST}.`);
  // stayAwake({
  //   url: "https://thrsqr.herokuapp.com",
  //   minutes: 27.5,
  //   start: 7,
  //   end: 24
  // });
});