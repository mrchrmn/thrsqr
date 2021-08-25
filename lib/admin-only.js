// SignIn check middleware
function adminOnly(_req, res, next) {
  if (!res.locals.superuser) {
    res.redirect(302, "/superusersignin");
  } else {
    next();
  }
}

module.exports = adminOnly;