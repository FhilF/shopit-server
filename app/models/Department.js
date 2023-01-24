"use strict";

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var DepartmentSchema = new Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, required: true, default: true },
  imageUrl: { type: String, required: true },
  children: [
    {
      // _id: { type: Schema.ObjectId, required: true },
      name: { type: String, required: true },
      isActive: { type: Boolean, required: true, default: true },
      children: [
        {
          // _id: { type: Schema.ObjectId, required: true },
          name: { type: String, required: true },
          isActive: { type: Boolean, required: true, default: true },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Department", DepartmentSchema);
