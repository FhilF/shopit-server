const db = require("../models");
const departmentsJson = require("../lib/jsonFiles/new-departments.json");
const paymentTypesJson = require("../lib/jsonFiles/payment-types.json");
const courierJson = require("../lib/jsonFiles/couriers.json");
const testerUserJson = require("../lib/jsonFiles/tester-user.json");
var mongoose = require("mongoose");
const { isProduction } = require("../config");
const Department = db.department,
  Courier = db.courier,
  PaymentMethod = db.paymentMethod,
  User = db.user,
  Shop = db.shop;

const setup = (req, res) => {
  addDepartments();
  addCouriers();
  addPaymentTypes();
  addUsers();
};

const addUsers = () => {
  User.find({
    _id: {
      $in: [
        mongoose.Types.ObjectId("63ff0c5939fd4066df82219a"),
        mongoose.Types.ObjectId("63ff0e19df46c9f8fc1544c0"),
      ],
    },
  }).exec((err, users) => {
    if (users.length === 0) {
      const shop = new Shop({
        _id: "63ff0e1bceab49acd7b11c42",
        name: "Vanguard",
        description: "We sell things",
        shopRepresentative: "Philip Jackson",
        phoneNumber: { countryCode: 63, number: 9568080444 },
        address: {
          country: "PH",
          region: "Central Luzon",
          province: "Nueva Ecija",
          city: "Cabanatuan City",
          barangay: "Aduas Norte",
          zipCode: "3100",
          addressLine1: "Mabuhay Street",
        },
        imageUrl: `https://shop-it-bucket.s3.us-east-2.amazonaws.com/${
          isProduction ? "main" : "dev"
        }/shop-image/3295a8a5-48a3-498c-a312-6d70e89fcfe1.png`,
      });

      shop.save((err, shop) => {
        if (err) return true;
        User.insertMany(testerUserJson, (err) => {
          if (err) {
            console.log("error", err);
          }

          console.log("tester password: tester123");
        });
      });
    }
  });
};

const addDepartments = () => {
  Department.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Department.insertMany(departmentsJson, (err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added departments");
      });
    }
  });
};

const addPaymentTypes = () => {
  PaymentMethod.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      PaymentMethod.insertMany(paymentTypesJson, (err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added payment types");
      });
    }
  });
};

const addCouriers = () => {
  Courier.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Courier.insertMany(courierJson, (err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added couriers");
      });
    }
  });
};

module.exports = setup;
