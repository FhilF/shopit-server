const { Router } = require("express");

const testAuthRoutes = require("./test.routes");
const googleAuthRoutes = require("./auth/googleAuth.routes");
const localAuthRoutes = require("./auth/localAuth.routes");
const globalRoutes = require("./global.routes");

const shopRoutes = require("./shop.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");

const router = Router();

router.use("/test", testAuthRoutes);
router.use("/auth", localAuthRoutes);
router.use("/auth", googleAuthRoutes);
router.use("/api/shop", shopRoutes);
router.use("/api/user", userRoutes);

router.use("/api/department", departmentRoutes);

router.use("/", globalRoutes);

module.exports = router;
