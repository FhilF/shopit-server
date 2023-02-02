const db = require("../models"),
  Courier = db.courier;
exports.getCouriers = async (req, res, next) => {
  Courier.find({ isDeleted: false }).exec((err, courier) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    res.status(200).send({ Courier: courier });
  });
};
