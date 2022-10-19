const { Router } = require("express"),
  passport = require("passport");

const router = Router(),
  gooleAuthController = require("../../controllers/googleAuth.controller");

router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: true }),
  gooleAuthController.googleCallback
);

module.exports = router;
