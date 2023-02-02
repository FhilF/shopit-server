const db = require("../models"),
  PaymentMethods = db.paymentMethod;
exports.getPaymentMethods = async (req, res, next) => {
  PaymentMethods.find({ isDeleted: false }).exec((err, paymentMethod) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    res.status(200).send({ PaymentMethods: paymentMethod });
  });
};
