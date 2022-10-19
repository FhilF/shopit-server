const GoogleStrategy = require("passport-google-oauth20").Strategy,
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
        try {
          let existingUser = await User.findOne({ "google.id": profile.id });
          if (existingUser) {
            return done(null, existingUser);
          }

          // console.log(profile)
          const role = await Role.findOne({ name: "user" });

          const newUser = new User({
            provider: "google",
            googleId: profile.id,
            username: `user${profile.id}`,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.picture,
            roles: [role.id],
          });
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};
