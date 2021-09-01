const catchError = require("../lib/catch-error");
const controller = require("../controllers/misc");

const express = require("express");
const router = express.Router();

// Welcome page
router.get("/", (_req, res) => {
  res.render("welcome");
});

// Delete user session data
router.get("/reset/user", (req, res) => {
  delete req.session.superuser;
  delete req.session.username;
  delete req.session.participantId;
  delete req.session.lastComment;
  delete req.session.language;

  res.redirect(req.headers.referer);
});

// Swap German and English via session
router.get("/change-language", (req, res) => {
  req.session.language = req.session.language === "en" ? "de" : "en";
  res.redirect(req.headers.referer);
});

// Webmanifest
router.get("/site/webmanifest/:eventId", catchError(controller.generateManifest));

router.post("/unsubscribe-all", catchError(controller.unsubscribeAll));

module.exports = router;