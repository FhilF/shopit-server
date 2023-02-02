const db = require("../models");
const departmentsJson = require("../lib/jsonFiles/new-departments.json");
const paymentTypesJson = require("../lib/jsonFiles/payment-types.json");
const courierJson = require("../lib/jsonFiles/couriers.json");
const Department = db.department,
  Courier = db.courier,
  PaymentMethod = db.paymentMethod;

const setup = (req, res) => {
  addDepartments();
  addCouriers();
  addPaymentTypes();
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
