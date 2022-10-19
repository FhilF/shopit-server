const { Router } = require("express");
const router = Router();

router.get("/", function (req, res) {
  res.status(200).send({ status: "ready" });
});

router.use((req, res, next) => {
  res.status(404).send({ url: req.originalUrl + " not found" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

module.exports = router;
