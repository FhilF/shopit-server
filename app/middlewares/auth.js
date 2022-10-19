const passport = require("passport");

exports.jwtAuth = passport.authenticate("jwt", { session: false });
exports.checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

exports.passportLocalAuth = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send({ message: info.message });
    }
    // console.log(user)
    req.user = user;
    next();
  })(req, res, next);
};
