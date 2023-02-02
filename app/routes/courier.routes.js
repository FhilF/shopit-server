const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  CourierController = require("../controllers/courier.controller");

const router = Router();

router.get("/", CourierController.getCouriers);
// router.post("/", DepartmentController.addShop);
// router.patch("/", ShopController.updateShop);
// router.delete("/", ShopController.deleteShop);

module.exports = router;
