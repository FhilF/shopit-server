const db = require("../models");
const departmentsJson = require("../lib/new-departments.json");
const Department = db.department,
  Courier = db.courier;

const setup = (req, res) => {
  addDepartments();
  addCouriers();
};

const addDepartments = () => {
  Department.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Department.insertMany(
        departmentsJson,
        (err) => {
          if (err) {
            console.log("error", err);
          }

          console.log("added departments");
        }
      );
    }
  });
};

const addCouriers = () => {
  Courier.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      Courier.insertMany([{ name: "JMT" }], (err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added couriers");
      });
    }
  });
};

module.exports = setup;
