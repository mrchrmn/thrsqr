/* eslint-disable max-len */
const TEXTS = require("../locale/texts.json").texts;

module.exports = {

  async signin(req, res) {
    let username = req.body.username.trim();
    let password = req.body.password;
    let authenticated = await res.locals.store.userAuthenticated(username, password);
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
  },

  logout(req, res) {
    req.session.superuser = false;
    res.redirect("/");
  },

  async deleteInactiveEvents(req, res) {
    await res.locals.store.deleteInactiveEvents();
    req.flash("message", "Inactive events deleted.");
    res.render("/superuser", {
      flash: req.flash(),
    });
  },

  async deleteInactiveParticipants(req, res) {
    await res.locals.store.deleteInactiveParticipants();
    req.flash("message", "Inactive participants deleted.");
    res.render("/superuser", {
      flash: req.flash(),
    });
  }
};