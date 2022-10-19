"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;

db.user = require("./User");
// db.role = require("./Role");
db.shop = require("./Shop");
db.address = require("./Address");
db.department = require("./Department");
db.product = require("./Product");
db.productReview = require("./ProductReview");
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
