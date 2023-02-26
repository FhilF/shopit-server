const { Router } = require("express"),
  passport = require("passport");

const router = Router();
const { authMiddleware } = require("../../middlewares"),
  AuthController = require("../../controllers/auth.controller");

router.post(
  "/account/setup",
  [authMiddleware.checkAuthentication],
  AuthController.setupNonEmailProviderAccount
);

module.exports = router;
