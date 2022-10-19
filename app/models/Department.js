"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var DepartmentSchema = new Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model("Department", DepartmentSchema);
