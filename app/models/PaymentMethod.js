"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var PaymentTypeSchema = new Schema({
  name: { type: String, required: true },
  isDeleted: { type: Boolean, required: true, default: false },
  isDisabled: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("PaymentMethod", PaymentTypeSchema);
