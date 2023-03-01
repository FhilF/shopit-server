const passport = require("passport"),
  { faker } = require("@faker-js/faker");

const {
    registerSchema,
  } = require("../scripts/schemaValidators/authentication"),
  config = require("../config"),
  db = require("../models"),
  User = db.user,
  Role = db.role,
  Token = db.token;

const { getTransporter } = require("../services/nodeMailer");

const crypto = require("crypto");
const { baseVerificationUrl } = require("../config");

const milliSecondPerHr = 3600000;

exports.verifyEmail = (req, res, next) => {
  if (!req.params.token || !req.params.email) {
    return res.status(400).send({ message: "Invalid parameter." });
  }
  Token.findOne({ token: req.params.token }).exec((err, token) => {
    if (err) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }
    if (!token) {
      return res.status(400).send({
        message: req.user
          ? "Your verification link may have expired. Navigate to email verification to resend the verification link."
          : "Your verification link may have expired. Please login your account and navigate to email verification to resend the verification link.",
      });
    }

    User.findOne({ _id: token.UserId, email: req.params.email }).exec(
      (err, user) => {
        if (err) {
          return res.status(500).send({
            message: "There was an error submitting your request",
          });
        }
        if (!user) {
          return res.status(400).send({
            message: "No user found.",
          });
        }

        if (user._doc.isEmailVerified) {
          return res.status(400).send({ message: "User already verified" });
        }

        user.isEmailVerified = true;
        user.save((err, user) => {
          // error occur
          if (err) {
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          }
          // account successfully verified
          if (req.user) {
            req.user.isEmailVerified = true;
          }

          return res
            .status(200)
            .send("Your account has been successfully verified");
        });
      }
    );
  });
};

exports.sendVerification = async (req, res, next) => {
  const { email } = req.params;
  User.findOne({ email: email }).exec((err, user) => {
    if (err) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }

    if (!user) {
      return res.status(404).send({ message: "No user found" });
    }

    if (user._doc.isEmailVerified) {
      return res.status(400).send({ message: "User already verified" });
    }

    const randToken = crypto.randomBytes(16).toString("hex");

    var newToken = new Token({
      UserId: user._doc._id,
      token: randToken,
    });

    newToken.save((err) => {
      if (err) {
        return res.status(500).send({ message: err.message });
      }

      const link = `${baseVerificationUrl}/${user._doc.email}/${randToken}`;

      var mailOptions = {
        to: user._doc.email,
        subject: "Account Verification Link",
        html:
          `Hello ${user._doc.username},<br> Please Click on the link to verify your email.<br><a href=` +
          link +
          ">Click here to verify</a>",
      };
      return getTransporter().sendMail(mailOptions, function (err) {
        if (err) {
          return res.status(500).send({
            msg: "Technical Issue!, Please click on resend for verify your Email.",
          });
        }
        return res
          .status(200)
          .send(
            "A verification email has been sent to " +
              user._doc.email +
              ". It will be expire after 30mins. If you not get verification Email click on resend token."
          );
      });
    });
  });
};

exports.signup = async (req, res, next) => {
  const { email, password, name, username, phoneNumber } = req.body;
  const validation = registerSchema.safeParse({
    email,
    password,
    name,
    username,
    phoneNumber,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  User.find()
    .or([{ email }, { username }, { phoneNumber }])
    .exec((err, user) => {
      if (err) {
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      }

      if (user.length > 0) {
        if (email === user[0]._doc.email && user[0]._doc.provider === "google")
          return res.status(400).send({
            key: "email",
            message: "Account is already link to a google account.",
          });

        if (email === user[0]._doc.email)
          return res
            .status(400)
            .send({ key: "email", message: "Email is already in use." });

        if (username === user[0]._doc.username)
          return res
            .status(400)
            .send({ key: "username", message: "Username is already in use." });

        if (
          phoneNumber &&
          phoneNumber.number === user[0]._doc.phoneNumber.number
        )
          return res.status(400).send({
            key: "phoneNumber.number",
            message: "Phone number is already in use.",
          });
      }
      const newUser = new User({
        provider: "email",
        Roles: ["User"],
        email,
        password,
        username,
        name,
        phoneNumber,
      });

      newUser.register(newUser, (err, user) => {
        if (err)
          return res.status(500).send({ message: "Internal Server Error" });

        delete user._doc.provider;
        delete user._doc.password;
        delete user._doc.__v;

        const randToken = crypto.randomBytes(16).toString("hex");

        var newToken = new Token({
          UserId: user._doc._id,
          token: randToken,
        });

        newToken.save((err) => {
          if (err) {
            return res.status(500).send({ message: err.message });
          }

          const link = `${baseVerificationUrl}/${user._doc.email}/${randToken}`;

          var mailOptions = {
            to: user._doc.email,
            subject: "Account Verification Link",
            html:
              `Hello ${user._doc.username},<br> Please Click on the link to verify your email.<br><a href=` +
              link +
              ">Click here to verify</a>",
          };
          return getTransporter().sendMail(mailOptions, function (err) {
            if (err) {
              return res.status(500).send({ message: err.message });
            }

            return res.status(200).send({ user: user._doc });
          });
        });
      });
    });
};

exports.signin = (req, res, next) => {
  const user = req.user;
  return res.status(200).send({
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      avatar: user.avatar,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      isUserUpdated: user.isUserUpdated,
      Addresses: user.Addresses,
      Cart: user.Addresses,
      Shop: user.Shop,
    },
  });
};

exports.signout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      console(err);
      return next(err);
    }

    req.session.destroy((error) => {
      req.session = null;
      if (error) return next(error);
      res.redirect("/");
    });
  });
  // req.logOut();
  // req.session.destroy((err) => {
  //   clearCookie("connect.sid", { path: "/" });
  //   res.clearCookie("jwt");
  //   res.clearCookie("connect.sid");
  //   // Don't redirect, just print text
  //   res.send("Logged out");
  // });
};
