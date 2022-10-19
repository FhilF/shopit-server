const JwtStrategy = require("passport-jwt").Strategy,
  // ExtractJwt = require("passport-jwt").ExtractJwt,
  config = require("../config");

var cookieExtractor = function (req) {
  var token = null;
  if (req && req.cookies) token = req.cookies["jwt"];
  return token;
};

// opts.issuer = "accounts.examplesoft.com";
// opts.audience = "localhost:5000";

module.exports = (passport) => {
  var opts = {};
  opts.jwtFromRequest = cookieExtractor; // check token in cookie
  opts.secretOrKey = config.jwtSecretKey;
  opts.audience = config.audience;
  passport.use(
    new JwtStrategy(opts, async (jwtPayload, done) => {
      try {
        const user = jwtPayload.username;
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    })
  );
};
