"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var AddressSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    countryCode: {
      type: Number,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
  },
  telephoneNumber: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  region: { type: String, required: true },
  province: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  barangay: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  addressLine1: {
    type: String,
    required: true,
  },
  addressLine2: { type: String },
  label: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    required: true,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("address", AddressSchema);
