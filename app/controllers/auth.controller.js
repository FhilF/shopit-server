const {
    registerSchema,
    setupNonEmailProviderSchema,
  } = require("../scripts/schemaValidators/authentication"),
  config = require("../config"),
  db = require("../models"),
  User = db.user,
  Role = db.role,
  Token = db.token;

const { sessionedUserModelReturn } = require("../scripts/modelDataReturn/user");

exports.getSessionedUser = (req, res, next) => {
  if (!req.user) return res.status(200).send({});

  User.findOne({ username: req.user.username }, sessionedUserModelReturn)
    .populate("Shop", "-updatedAt -createdAt -__v")
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!user)
        return res
          .status(401)
          .send({ message: "There was an error submitting your request" });

      let sessionedUser = user._doc;
      sessionedUser.Addresses = sessionedUser.Addresses.filter(
        (v) => !v.isDeleted
      );

      return res.status(200).send({ sessionedUser });
    });
};

exports.setupNonEmailProviderAccount = async (req, res, next) => {
  const { username, phoneNumber } = req.body;
  const validation = setupNonEmailProviderSchema.safeParse({
    username,
    phoneNumber,
  });
  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  return User.find()
    .or([{ username }, { phoneNumber }])
    .exec((err, existingUser) => {
      if (err) {
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      }

      if (existingUser.length > 0) {
        if (username === existingUser[0]._doc.username)
          return res
            .status(400)
            .send({ key: "username", message: "Username is already in use." });

        if (
          phoneNumber &&
          phoneNumber.number === existingUser[0]._doc.phoneNumber.number
        )
          return res.status(400).send({
            key: "phoneNumber.number",
            message: "Phone number is already in use.",
          });
      }

      User.findOne({ _id: req.user.id }).exec((err, user) => {
        if (err) {
          return res.status(500).send({
            message: "There was an error submitting your request",
          });
        }

        if (!user) {
          return res.status(401).send({ message: "No user found" });
        }

        if (user._doc.isUserUpdated)
          return res.status(403).send({ message: "User is already updated" });

        user
          .updateOne({ username, phoneNumber, isUserUpdated: true })
          .exec((err) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            req.user.isUserUpdated = true;
            req.user.username = username;

            return res.status(200).send({
              message: "Successfully updated your account",
            });
          });
      });
    });
};
