const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  DepartmentController = require("../controllers/department.controller");

const router = Router();

router.get("/", DepartmentController.getDepartments);
// router.post("/", DepartmentController.addShop);
// router.patch("/", ShopController.updateShop);
// router.delete("/", ShopController.deleteShop);

module.exports = router;
