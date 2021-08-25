/* eslint-disable max-lines-per-function */


// ###### Configuration ######

const config = require("./lib/config");
const HOST = config.HOST;
const PORT = config.PORT;
const TEXTS = require("./data/texts.json");
const isProduction = (config.NODE_ENV === "production");


// ###### Express/Postgres modules ######

const express = require("express");
const flash = require("express-flash");
const session = require("express-session");


// ###### Postgres modules ######

const PgSession = require("connect-pg-simple")(session);
const PgStore = require("./model/pg-store");


// ###### App setuo ######

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");


// Session setup
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
  store: new PgSession({
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

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(session(sessionConfig));
app.use(flash());

// Create a new datastore
app.use((_req, res, next) => {
  res.locals.store = new PgStore();
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


// ###### Routing ######

const miscRouter = require("./routes/misc");
const eventRouter = require("./routes/event");
const superuserRouter = require("./routes/superuser");

app.use("/", miscRouter);
app.use("/event", eventRouter);
app.use("/superuser", superuserRouter);


// ###### Error handling ######

app.use((err, _req, res, _next) => {
  console.log(err);
  res.status(404)
     .send(err.message);
});


// ###### Let's go! ######

app.listen(PORT, HOST, () => {
  console.log(`ThrSqr listening on port ${PORT} of ${HOST}.`);
});