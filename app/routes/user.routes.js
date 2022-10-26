const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  UserController = require("../controllers/user.controller");

const router = Router();

// router.get("/", UserController.getUser);

router.post("/address", UserController.addAddress);
router.patch("/address", UserController.updateDefaultAddress);
router.delete("/address", UserController.deleteAddress);
router.get("/address", UserController.getAddress);

router.get("/cart/", UserController.getCartItem);
router.post("/cart/:id", UserController.addProductToCart);
router.delete("/cart/:id", UserController.deleteCartItem);

router.post("/order", UserController.orderItem);
router.post("/order/:id/cancel", UserController.cancelOrder);

module.exports = router;
