const { Router } = require("express"),
  router = Router(),
  { authMiddleware } = require("../middlewares");

router.get("/", (req, res, next) => {
  console.log(req.user)
  if (req.user) return res.send("Welcome");
  return res.send("No welcome");
});

router.get(
  "/user",
  [authMiddleware.checkAuthentication, authMiddleware.jwtAuth],
  (req, res, next) => {
    if (req.user) res.send("Welcome");
    else
      return res.status(401).json({
        error: "User not authenticated",
      });
  }
);

module.exports = router;
