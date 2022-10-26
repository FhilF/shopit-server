const { Router } = require("express");

const { authMiddleware } = require("../middlewares"),
  ShopController = require("../controllers/shop.controller");
ProductController = require("../controllers/product.controller");

const router = Router();

router.get("/", ShopController.getShop);
router.post("/", ShopController.addShop);
router.patch("/", ShopController.updateShop);

router.get("/product", ProductController.getOwnShopProducts);
router.get("/:id/product", ProductController.getShopProducts); //Shop Product
// router.get("/product", ShopController.getProducts);
router.post("/product", ProductController.addProduct);
router.patch("/product/:id", ProductController.updateProduct);
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

// router.delete("/", ShopController.deleteShop);

module.exports = router;
