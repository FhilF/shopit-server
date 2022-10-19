"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var ItemCategorySchema = new Schema({
  name: { type: String, required: true },
  other: [{ type: String, required: true }],
});

module.exports = mongoose.model("ItemCategory", ItemCategorySchema);
