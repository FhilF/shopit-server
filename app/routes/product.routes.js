const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  ProductController = require("../controllers/product.controller");

const router = Router();

router.get("/department", ProductController.getProductsByDept);
router.get("/:id", ProductController.getProduct);

module.exports = router;
