"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const ProductReview = require("./ProductReview");

var ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    Departments: [
      {
        _id: { type: Schema.ObjectId, required: true },
        name: { type: String, required: true },
        parentId: { type: Schema.ObjectId },
      },
    ],
    description: { type: String, required: true },
    specifications: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    isMultipleVariation: { type: Boolean, required: true },
    stock: { type: Number },
    price: { type: Number },
    images: [
      {
        isThumbnail: { type: Boolean, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
    variationName: { type: String },
    variations: [
      {
        name: { type: String, required: true },
        stock: { type: Number, required: true },
        price: { type: Number, required: true },
        sku: { type: String, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
    Shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    Reviews: [ProductReview.schema],
    isDeleted: { type: Boolean, required: true, default: false },
    delist: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
