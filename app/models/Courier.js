"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var CourierSchema = new Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model("courier", CourierSchema);
