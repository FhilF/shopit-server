"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const ProductReview = require("./ProductReview");

var ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    brand: { type: String, required: true },
    searchTerms: [{ type: String, required: true }],
    Shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
    Departments: [{ type: String, required: true }],
    Reviews: [ProductReview.schema],
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
