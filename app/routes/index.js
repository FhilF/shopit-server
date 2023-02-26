const { Router } = require("express");

const testAuthRoutes = require("./test.routes");
const googleAuthRoutes = require("./auth/googleAuth.routes");
const localAuthRoutes = require("./auth/localAuth.routes");
const globalAuthRoutes = require("./auth/index.routes");
const globalRoutes = require("./global.routes");

const shopRoutes = require("./shop.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");
const productRoutes = require("./product.routes");
const paymentMethodRoutes = require("./paymentMethod.routes");
const courierRoutes = require("./courier.routes");

const router = Router();

router.use("/sample", (req, res, next) => {
  return res.send("No welcome");
});

router.use("/test", testAuthRoutes);
router.use("/auth", localAuthRoutes);
router.use("/auth", googleAuthRoutes);
router.use("/auth", globalAuthRoutes);
router.use("/api/product", productRoutes);
router.use("/api/shop", shopRoutes);
router.use("/api/user", userRoutes);
router.use("/api/payment_method", paymentMethodRoutes);
router.use("/api/courier", courierRoutes);

router.use("/api/department", departmentRoutes);

router.use("/", globalRoutes);

module.exports = router;
