const LocalStrategy = require("passport-local").Strategy,
  z = require("zod");

const User = require("../models/User");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(function (username, password, callback) {
      User.findOne({ username }).exec((err, user) => {
        if (err) {
          return callback(err);
        }
        if (!user) {
          return callback(null, false, {
            message: "Incorrect username or password.",
          });
        }
        console.log(password);
        if (!user.comparePassword(password)) {
          return callback(null, false, {
            message: "Incorrect username or password.",
          });
        }
        user.populate("Shop", "-updatedAt -createdAt -__v");
        return callback(null, user);
      });
    })
  );
};
