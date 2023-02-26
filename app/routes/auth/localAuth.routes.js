const { Router } = require("express");

const { authMiddleware } = require("../../middlewares"),
  localAuthController = require("../../controllers/localAuth.controller");

const router = Router();

router.post("/send-verification/:email", localAuthController.sendVerification);
router.post("/verify/:email/:token", localAuthController.verifyEmail);

router.post("/register", localAuthController.signup);

router.post(
  "/signin",
  [authMiddleware.passportLocalAuth],
  localAuthController.signin
);

router.get("/signout", localAuthController.signout);

module.exports = router;
