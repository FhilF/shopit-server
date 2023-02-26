const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  ShopController = require("../controllers/shop.controller");
ProductController = require("../controllers/product.controller");

const multer = require("multer");
const upload = multer();

const router = Router();

const addProductUF = upload.fields([
  { name: "prodInfoImages", maxCount: 10 },
  { name: "prodVariantImages", maxCount: 15 },
]);

const updateProductUF = upload.fields([
  { name: "newProdImages", maxCount: 10 },
  { name: "oldVariationsNewImage", maxCount: 15 },
  { name: "newVariationsImage", maxCount: 15 },
]);

router.get("/:id/get-shop-info", ShopController.getShopInfo);

router.get(
  "/",
  [authMiddleware.checkAuthentication],
  ShopController.getOwnShop
);
router.post("/", upload.single("shopImage"), ShopController.addShop);
router.patch("/", upload.single("shopImage"), ShopController.updateShop);

router.get("/product", ShopController.getOwnProducts);
router.get("/:id/product", ProductController.getShopProducts); //Shop Product
// router.get("/product", ShopController.getProducts);
router.post("/product", addProductUF, ProductController.addProduct);
router.get("/product/:id", ProductController.getOwnProduct);
router.patch("/product/:id", updateProductUF, ProductController.updateProduct);
router.delete("/product/:id", ProductController.deleteProduct);

router.post("/product/:id/review", ProductController.addProductReview);
router.patch(
  "/product/:id/review/:reviewId",
  ProductController.updateProductReview
);
router.delete(
  "/product/:id/review/:reviewId",
  ProductController.deleteProductReview
);

router.post("/order/:id/cancel", ShopController.cancelOrder);
router.post("/order/:id/accept", ShopController.acceptOrder);
router.post("/order/:id/shipped", ShopController.shipOrder);
router.get("/order/:id", ShopController.getOrder);
router.get("/order", ShopController.getOrderList);

// router.delete("/", ShopController.deleteShop);

module.exports = router;
