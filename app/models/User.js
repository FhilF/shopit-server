"use strict";

const mongoose = require("mongoose"),
  bcrypt = require("bcrypt"),
  jwt = require("jsonwebtoken");

const config = require("../config"),
  Address = require("./Address"),
  Shop = require("./Shop");

const { Schema } = mongoose,
  SALT_WORK_FACTOR = 10;

const UserSchema = new Schema(
  {
    provider: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/^[a-z0-9_.]+$/, "is invalid"],
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true,
    },
    password: {
      type: String,
      trim: true,
      minlength: 6,
      maxlength: 60,
    },
    phoneNumber: {
      countryCode: {
        type: Number,
      },
      number: {
        type: Number,
        unique: true,
      },
    },
    name: {
      type: String,
      required: true,
    },
    avatar: String,
    bio: String,
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    Roles: [
      {
        type: String,
        required: true,
      },
    ],
    Shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    Addresses: [Address.schema],
    // Cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    Cart: [
      {
        type: new Schema(
          {
            Product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            variationId: { type: mongoose.Schema.Types.ObjectId },
            qty: { type: Number, required: true, default: 1 },
          },
          { timestamps: true }
        ),
      },
    ],
    Likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    isEmailVerified: { type: Boolean, required: true, default: false },
    //
    isUserUpdated: { type: Boolean, required: true, default: true },

    // messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

UserSchema.methods.register = (newUser, callback) => {
  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) return err;
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) return err;
      // set pasword to hash
      newUser.password = hash;

      newUser
        .save()
        .then((res) => callback(null, res))
        .catch((err) => callback(err, null));
    });
  });
};

UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);
};

UserSchema.methods.generateJWT = function () {
  const token = jwt.sign(
    {
      // expiresIn: "12h",
      id: this._id,
      provider: this.provider,
      username: this.username,
      aud: config.audience,
      iss: config.audience,
    },
    config.jwtSecretKey
  );
  return token;
};

module.exports = mongoose.model("User", UserSchema);
