const { Router } = require("express"),
  passport = require("passport");

const router = Router(),
  gooleAuthController = require("../../controllers/googleAuth.controller");

router.get(
  "/google",
  (req, res, next) => {
    const returnTo = req.query.origin;
    req.session.returnTo = returnTo;
    const state = returnTo
      ? Buffer.from(JSON.stringify({ returnTo })).toString("base64")
      : undefined;
    const authenticator = passport.authenticate("google", {
      scope: ["email", "profile"],
      prompt: 'select_account',
      state,
    });

    authenticator(req, res, next);
  }
  // passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: "/failed",
  }),
  gooleAuthController.googleCallback
);

router.get("/google/signout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
