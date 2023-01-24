"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var AddressSchema = new Schema({
  _id: false,
  country: {
    type: String,
    required: true,
  },
  region: { type: String },
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
});

var ShopSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    shopRepresentative: { type: String, required: true },
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
    address: AddressSchema,
    telephoneNumber: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", ShopSchema);
