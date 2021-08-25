const catchError = require("../lib/catch-error");
const eventController = require("../controllers/event");

const express = require("express");
const router = express.Router();

router.get("/new", (_req, res) => {
  res.render("new-event");
});

router.get("/:eventId", catchError(eventController.display));

module.exports = router;