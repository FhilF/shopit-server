const {
    shopAddValidator,
    shopUpdateValidator,
  } = require("../scripts/schemaValidators/shop"),
  db = require("../models"),
  User = db.user,
  Shop = db.shop,
  Department = db.department;

exports.getDepartments = (req, res, next) => {
  const { parentOnly } = req.query;

  let fields = ["-__v", "-isActive"];
  if (parentOnly === "1") fields.push("-children");

  Department.find({ isActive: true }, fields.join(" "))
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

      let depts = departments;
      if (depts && depts[0].children) {
        depts = depts.map((v1) => {
          return {
            ...v1._doc,
            parent_id: 0,
            children: v1._doc.children.map((v2) => {
              return {
                ...v2._doc,
                parent_id: v1._doc._id,
                children: v2._doc.children.map((v3) => {
                  return {
                    ...v3._doc,
                    parent_id: v2._doc._id,
                  };
                }),
              };
            }),
          };
        });
      }

      res.status(200).send({ Departments: depts });
    });
};
