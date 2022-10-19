const {
    shopAddValidator,
    shopUpdateValidator,
  } = require("../scripts/schemaValidators/shop"),
  db = require("../models"),
  User = db.user,
  Shop = db.shop,
  Department = db.department;

exports.getDepartments = (req, res, next) => {
  Department.find()
    .sort([["name", 1]])
    .exec((err, departments) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!departments)
        return res.status(404).send({
          message: "Departments doesn't exist",
        });

      res
        .status(200)
        .send({ Departments: departments });
    });
};
