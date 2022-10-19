const db = require("../models");
const Department = db.department;

const setup = (req, res) => {
  addDepartments();
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

module.exports = setup;
