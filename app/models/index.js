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
db.order = require("./Order");
db.courier = require("./Courier");
db.paymentMethod = require("./PaymentMethod");
db.token = require("./Token");
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;
