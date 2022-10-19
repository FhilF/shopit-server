const { isValidObjectId } = require("mongoose");
const {
    productValidator,
    productUpdateValidator,
    reviewValidator,
    reviewUpdateValidator,
  } = require("../scripts/schemaValidators/product"),
  db = require("../models");

const User = db.user,
  Shop = db.shop,
  Department = db.department,
  Product = db.product,
  ProductReview = db.productReview;

exports.addProduct = (req, res, next) => {
  const { name, stock, price, description, brand, searchTerms, departments } =
    req.body;

  const validation = productValidator.safeParse({
    name,
    stock,
    price,
    description,
    brand,
    searchTerms,
    departments,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  if (!req.user.Shop) {
    return res.status(404).send({
      message: "User hasn't set up their shop",
    });
  }

  Department.find({ _id: { $in: departments } }).exec((err, dept) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (dept.length !== departments.length) {
      return res.status(500).send({
        message: "Invalid department",
      });
    }

    let newDepartments = dept.map((a) => a.name);

    const newProduct = new Product({
      name,
      stock,
      price,
      description,
      brand,
      searchTerms,
      Departments: newDepartments,
      Shop: req.user.Shop,
    });

    newProduct.save((err, product) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      delete product._doc.Shop;
      delete product._doc.__v;
      delete product._doc.isDeleted;
      res.status(200).send({ product });
    });
  });
};

exports.getOwnShopProducts = (req, res, next) => {
  if (!req.user.Shop) {
    return res.status(404).send({
      message: "User hasn't set up their shop",
    });
  }

  Product.find(
    { Shop: req.user.Shop, isDeleted: false },
    "-isDeleted -__v"
  ).exec((err, products) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (products.length === 0) {
      return res.status(404).send({ products: [] });
    }

    return res.status(200).send({ products });
  });
};

exports.getShopProducts = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  Product.find(
    { Shop: req.params.id, isDeleted: false },
    "-isDeleted -__v"
  ).exec((err, products) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (products.length === 0) {
      return res.status(404).send({ products: [] });
    }

    return res.status(200).send({ products });
  });
};

exports.updateProduct = (req, res, next) => {
  const { name, stock, price, description, brand, searchTerms, departments } =
    req.body;

  if (!req.user.Shop) {
    return res.status(404).send({
      message: "User hasn't set up their shop",
    });
  }

  if (!req.params.id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  const validation = productUpdateValidator.safeParse({
    name,
    stock,
    price,
    description,
    brand,
    searchTerms,
    departments,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  Product.findOneAndUpdate(
    { _id: req.params.id, Shop: req.user.Shop, isDeleted: false },
    { name, stock, price, description, brand, searchTerms, departments },
    { new: true }
  ).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product)
      return res.status(404).send({
        message: "Product not found",
      });

    delete product._doc.isDeleted;
    delete product._doc.__v;
    res.status(200).send({ product });
  });
};

exports.deleteProduct = (req, res, next) => {
  if (!req.user.Shop) {
    return res.status(404).send({
      message: "User hasn't set up their shop",
    });
  }

  if (!req.params.id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  Product.findOneAndUpdate(
    { _id: req.params.id, Shop: req.user.Shop, isDeleted: false },
    { isDeleted: true },
    { new: true }
  ).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product)
      return res.status(404).send({
        message: "Product not found",
      });
    res.status(200).send({ message: "Product is deleted" });
  });
};

exports.addProductReview = (req, res, next) => {
  const { review, rate } = req.body;

  if (!req.params.id) {
    return res.status(400).send({
      message: "No Product Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  const validation = reviewValidator.safeParse({
    review,
    rate,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  const newReview = new ProductReview({
    userId: req.user.id,
    name: req.user.name,
    review: review,
    imageUrls: [],
    rate: rate,
  });

  Product.findOneAndUpdate(
    { _id: req.params.id, Shop: { $ne: req.user.Shop }, isDeleted: false },
    {
      $push: {
        Reviews: newReview,
      },
    }
  ).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product)
      return res.status(404).send({
        message: "Product not found",
      });

    delete newReview._doc.isDeleted;
    res.status(200).send({ Review: newReview._doc });
  });
};

exports.updateProductReview = (req, res, next) => {
  const { review, rate } = req.body;

  if (!req.params.id || !req.params.reviewId) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (
    !isValidObjectId(req.params.id) ||
    !isValidObjectId(req.params.reviewId)
  ) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  const validation = reviewUpdateValidator.safeParse({
    review,
    rate,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  Product.findOne({
    _id: req.params.id,
    "Reviews._id": req.params.reviewId,
  }).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product)
      return res.status(404).send({
        message: "Review not found",
      });

    const filteredProduct = product._doc.Reviews.filter(
      (v) => v._id.toHexString() === req.params.reviewId
    )[0];

    if (filteredProduct.isDeleted === true)
      return res.status(500).send({
        message: "Review not found",
      });

    if (filteredProduct.userId !== req.user.id)
      return res.status(500).send({
        message: "User cannot update other user's review",
      });

    return Product.updateOne(
      { "Reviews._id": req.params.reviewId },
      { $set: { "Reviews.$.rate": rate, "Reviews.$.review": review } }
    ).exec((err, reviewUpdate) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!reviewUpdate)
        return res.status(404).send({
          message: "Review not found",
        });

      const Review = {
        ...filteredProduct._doc,
        rate: rate ? rate : filteredProduct._doc.rate,
        review: review ? review : filteredProduct._doc.review,
      };

      res.status(200).send({ Review });
    });
  });
};

exports.deleteProductReview = (req, res, next) => {
  if (!req.params.id || !req.params.reviewId) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (
    !isValidObjectId(req.params.id) ||
    !isValidObjectId(req.params.reviewId)
  ) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  Product.findOne({
    _id: req.params.id,
    "Reviews._id": req.params.reviewId,
  }).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product)
      return res.status(404).send({
        message: "Review not found",
      });

    const filteredProduct = product._doc.Reviews.filter(
      (v) => v._id.toHexString() === req.params.reviewId
    )[0];

    if (filteredProduct.isDeleted === true)
      return res.status(500).send({
        message: "Review not found",
      });

    if (filteredProduct.userId !== req.user.id)
      return res.status(500).send({
        message: "User cannot update other user's review",
      });

    return Product.updateOne(
      { "Reviews._id": req.params.reviewId },
      { $set: { "Reviews.$.isDeleted": true } }
    ).exec((err, reviewUpdate) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!reviewUpdate)
        return res.status(404).send({
          message: "Review not found",
        });

      res.status(200).send({
        message: "Review Deleted",
      });
    });
  });
};
