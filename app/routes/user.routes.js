const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  UserController = require("../controllers/user.controller");

const router = Router(),
  multer = require("multer"),
  upload = multer();

// router.get("/", UserController.getUser);

router.get("/", UserController.getSessionedUser);
router.patch(
  "/account/email",
  [authMiddleware.checkAuthentication],
  UserController.updateAccountEmail
);
router.patch(
  "/account/phonenumber",
  [authMiddleware.checkAuthentication],
  UserController.updateAccountPhoneNumber
);
router.patch(
  "/account/profile",

  [authMiddleware.checkAuthentication, upload.single("avatar")],

  UserController.updateAccountProfile
);

router.post(
  "/address",
  [authMiddleware.checkAuthentication],
  UserController.addAddress
);
router.patch(
  "/address/:id",
  [authMiddleware.checkAuthentication],
  UserController.updateAddress
);
router.patch(
  "/address/:id/default",
  [authMiddleware.checkAuthentication],
  UserController.updateDefaultAddress
);
router.delete(
  "/address/:id",
  [authMiddleware.checkAuthentication],
  UserController.deleteAddress
);
router.get(
  "/address",
  [authMiddleware.checkAuthentication],
  UserController.getAddress
);

router.get(
  "/cart/",
  [authMiddleware.checkAuthentication],
  UserController.getCartItems
);
router.post(
  "/cart/:id",
  [authMiddleware.checkAuthentication],
  UserController.addProductToCart
);

router.patch(
  "/cart/:id",
  [authMiddleware.checkAuthentication],
  UserController.updateCartItemQty
);

router.delete(
  "/cart/:id",
  [authMiddleware.checkAuthentication],
  UserController.deleteCartItem
);

router.get(
  "/order/:id",
  [authMiddleware.checkAuthentication],
  UserController.getOrder
);

router.post(
  "/order/:id/cancel",
  [authMiddleware.checkAuthentication],
  UserController.cancelOrder
);

router.get(
  "/order",
  [authMiddleware.checkAuthentication],
  UserController.getOrderList
);

router.post(
  "/order",
  [authMiddleware.checkAuthentication, authMiddleware.verifyUser],
  UserController.placeOrder
);

router.post(
  "/order/review/:id",
  [authMiddleware.checkAuthentication],
  UserController.addOrderReview
);
module.exports = router;
