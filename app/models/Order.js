"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var Address = new Schema({
  name: {
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
  // Addresses:,
});

var Status = new Schema(
  {
    status: { type: String, required: true },
    code: { type: Number, required: true },
  },
  { timestamps: true }
);

var OrderSchema = new Schema(
  {
    Shop: {
      _id: [{ type: Schema.ObjectId, required: true }],
      name: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      telephoneNumber: { type: String },
      address: Address,
      Orders: [
        {
          _id: { type: Schema.ObjectId, required: true },
          name: { type: String, required: true },
          price: { type: Number, required: true, default: 1 },
          thumbnail: { type: String, required: true },
          orderQty: { type: Number, required: true, default: 1 },
        },
      ],
    },
    User: {
      _id: { type: Schema.ObjectId, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
      Addresses: { billTo: Address, shipTo: Address },
    },
    Courier: {
      name: { type: String, required: true },
    },
    paymentType: { type: String, required: true },
    isCancelled: { type: Boolean, required: true, default: false },
    isAccepted: { type: Boolean, required: true, default: false },
    isShipped: { type: Boolean, required: true, default: false },
    discount: { type: String },
    StatusLog: [Status],
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", OrderSchema);
