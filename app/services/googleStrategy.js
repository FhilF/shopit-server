const GoogleStrategy = require("passport-google-oauth2").Strategy,
  db = require("../models"),
  Role = db.role,
  User = db.user;

module.exports = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/auth/google/callback",
        proxy: true,
        // passReqToCallback: true,
      },
      async (request, accessToken, refreshToken, profile, done) => {
        User.findOne({ googleId: profile.id }).exec((err, user) => {
          if (err) return done(err, false);

          if (user) return done(null, user);

          const newUser = new User({
            provider: "google",
            googleId: profile.id,
            username: `shopit_user_${profile.id}`,
            email: profile.emails[0].value,
            name: profile.displayName,
            isEmailVerified: true,
            isUserUpdated: false,
          });
          newUser
            .save()
            .then((res) => {
              return done(null, newUser);
            })
            .catch((err) => {
              return done(err, false);
            });
        });
      }
    )
  );
};
