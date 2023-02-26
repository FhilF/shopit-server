"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const milliSecondPerHr = 3600000;
var Token = new Schema({
  UserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  token: { type: String, required: true },
  createdAt: { type: Date, expires: '30m', default: Date.now }
});

module.exports = mongoose.model("token", Token);
