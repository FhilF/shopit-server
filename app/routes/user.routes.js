const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  UserController = require("../controllers/user.controller");

const router = Router(),
  multer = require("multer"),
  upload = multer();

// router.get("/", UserController.getUser);

router.get(
  "/",
  [authMiddleware.checkAuthentication],
  UserController.getSessionedUser
);
router.patch("/account/email", UserController.updateAccountEmail);
router.patch("/account/phonenumber", UserController.updateAccountPhoneNumber);
router.patch(
  "/account/profile",
  upload.single("avatar"),
  UserController.updateAccountProfile
);

router.post("/address", UserController.addAddress);
router.patch("/address/:id", UserController.updateAddress);
router.patch("/address/:id/default", UserController.updateDefaultAddress);
router.delete("/address/:id", UserController.deleteAddress);
router.get("/address", UserController.getAddress);

router.get("/cart/", UserController.getCartItem);
router.post("/cart/:id", UserController.addProductToCart);
router.delete("/cart/:id", UserController.deleteCartItem);

router.post("/order", UserController.orderItem);
router.post("/order/:id/cancel", UserController.cancelOrder);

module.exports = router;
