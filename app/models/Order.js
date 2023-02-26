"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var Address = new Schema({
  name: {
    type: String,
  },
  phoneNumber: {
    countryCode: {
      type: Number,
    },
    number: {
      type: Number,
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
  // Addresses:,
});

var OrderSchema = new Schema(
  {
    Shop: {
      _id: { type: Schema.ObjectId, required: true },
      name: { type: String, required: true },
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
      telephoneNumber: { type: String },
      shopRepresentative: { type: String, required: true },
      address: Address,
      Orders: [
        {
          _id: { type: Schema.ObjectId, required: true },
          name: { type: String, required: true },
          thumbnail: { type: String, required: true },
          variationId: { type: Schema.ObjectId },
          variationName: { type: String },
          variation: { type: String },
          unitPrice: { type: Number, required: true, default: 1 },
          qty: { type: Number, required: true, default: 1 },
          isRated: { type: Boolean, required: true, default: false },
          review: {
            rate: { type: Number},
            comment: { type: String },
          },
        },
      ],
    },
    User: {
      _id: { type: Schema.ObjectId, required: true },
      email: { type: String, required: true },
      name: { type: String, required: true },
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
      Addresses: { billTo: Address, shipTo: Address },
    },
    paymentMethod: {
      _id: { type: Schema.ObjectId, required: true },
      name: { type: String, required: true },
    },
    isCancelled: { type: Boolean, required: true, default: false },
    isAccepted: { type: Boolean, required: true, default: false },
    isShipped: { type: Boolean, required: true, default: false },
    isDelivered: { type: Boolean, required: true, default: false },
    statusLog: [
      {
        type: new Schema(
          {
            code: { type: Number, required: true },
            status: { type: String, required: true },
          },
          {
            timestamps: {
              createdAt: "timestamp",
              updatedAt: false,
            },
          }
        ),
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", OrderSchema);
