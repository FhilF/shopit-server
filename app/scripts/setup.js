const db = require("../models");
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
        [
          { name: "Electronics" },
          { name: "Computers" },
          { name: "Automotive" },
          { name: "Baby" },
          { name: "Women's Fashion" },
          { name: "Men's Fashion" },
          { name: "Health" },
          { name: "Industrial" },
          { name: "Software" },
          { name: "Tools" },
          { name: "Toys" },
          { name: "Video Games" },
          { name: "Sports" },
        ],
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
