const catchError = require("../lib/catch-error");
const controller = require("../controllers/event");

const express = require("express");
const router = express.Router();

// Display new event form
router.get("/new", (_req, res) => {
  res.render("new-event");
});

// Edit existing event
router.get("/:eventId/edit", catchError(controller.edit));

// Display event
router.get("/:eventId", catchError(controller.display));

// Redirect from title slug to event
router.get("/:slug/:eventId", (req, res) => {
  res.redirect(303, `/event/${req.params.eventId}`);
});

// Successfully registered new event
router.post("/new", catchError(controller.new));

// Update existing event details
router.post("/:eventId/edit", catchError(controller.update));

// Update responses (there or square)
router.post("/:eventId/:there", catchError(controller.updateResponses));

// Remove response
router.post("/:eventId/remove/:participantId", catchError(controller.removeResponse))

module.exports = router;