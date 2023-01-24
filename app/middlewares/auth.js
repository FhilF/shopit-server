const passport = require("passport");

const config = require("../config");

exports.jwtAuth = passport.authenticate("jwt", { session: false });
exports.checkAuthentication = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({
    error: "User not authenticated",
  });
};

passport.authenticate("google");
exports.passportLocalAuth = (req, res, next) => {
  passport.authenticate("local", { session: true }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(404).send({ message: info.message });
    }
    req.login(user, (err) => {
      if (err) return next(err);

      const token = user.generateJWT();
      res.cookie("jwt", token, {
        // maxAge: 900000,
        httpOnly: true,
        expires: new Date(Date.now() + config.cookieJwtExpiration),
      });

      next();
    });
  })(req, res, next);
};
