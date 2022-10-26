"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var AddressSchema = new Schema({
  _id: false,
  namew: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  telephoneNumber: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  district: {
    type: String,
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
    address: AddressSchema,
    phoneNumber: { type: String, required: true },
    category: [{ type: String, required: true }],
    telephoneNumber: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", ShopSchema);
