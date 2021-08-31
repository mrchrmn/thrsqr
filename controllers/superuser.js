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

  async deleteInactiveEvents(_req, res) {
    await res.locals.store.deleteInactiveEvents();
    res.redirect("/superuser");
  },

  async deleteInactiveParticipants(_req, res) {
    await res.locals.store.deleteInactiveParticipants();
    res.redirect("/superuser");
  }

}