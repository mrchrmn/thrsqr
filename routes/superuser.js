/* eslint-disable max-len */
const catchError = require("../lib/catch-error");
const adminOnly = require("../lib/admin-only");
const controller = require("../controllers/superuser");

const express = require("express");
const router = express.Router();

// Display admin page
router.get("/", adminOnly, (_req, res) => {
  res.render("superuser");
});

// Display signin form
router.get("/signin", (_req, res) => {
  res.render("signin");
});

// Display admin page
router.get("/logout", catchError(controller.logout));

// Signing in
router.post("/signin", catchError(controller.signin));

// Deleting inactive events or participants
router.post("/delete-inactive-events", adminOnly,
                                       catchError(controller.deleteInactiveEvents));
router.post("/delete-inactive-participants", adminOnly,
                                       catchError(controller.deleteInactiveParticipants));

module.exports = router;