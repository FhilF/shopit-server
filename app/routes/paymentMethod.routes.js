const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  PaymentMethodController = require("../controllers/paymentMethod.controller");

const router = Router();

router.get("/", PaymentMethodController.getPaymentMethods);
module.exports = router;
