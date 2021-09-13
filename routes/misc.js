const catchError = require("../lib/catch-error");
const controller = require("../controllers/misc");

const express = require("express");
const router = express.Router();

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

router.get("/change-language", (req, res) => {
  req.session.language = req.session.language === "en" ? "de" : "en";
  res.redirect(req.headers.referer);
});

router.get("/site/webmanifest/:eventId", catchError(controller.generateManifest));

router.get("/s3request", catchError(controller.getS3Request));

router.post("/unsubscribe-all", catchError(controller.unsubscribeAll));

router.post("/timezone-abbrev", catchError(controller.getTimezoneAbbrev));

module.exports = router;