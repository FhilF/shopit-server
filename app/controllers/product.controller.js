const { isValidObjectId, Types } = require("mongoose"),
  { v4: uuidv4 } = require("uuid");
const { mediaFolderName } = require("../config");
const {
  unsetProductList,
} = require("../scripts/aggregationDataReturn/product");
const { getFileExt } = require("../scripts/helper");
const {
  productList,
  productDisplay,
} = require("../scripts/modelDataReturn/product");

const {
    productMultiVarValidator,
    productNonMultiVarValidator,
    productNonMultiVarUpdateValidator,
    productMultiVarUpdateValidator,
    reviewValidator,
    reviewUpdateValidator,
  } = require("../scripts/schemaValidators/product"),
  db = require("../models"),
  { uploadFile } = require("../services/aws");

const User = db.user,
  Shop = db.shop,
  Department = db.department,
  Product = db.product,
  ProductReview = db.productReview;

exports.getProductsByDept = async (req, res, next) => {
  const id = req.query.id;
  if (!id) {
    return res.status(400).send({
      message: "No id provided!",
    });
  }

  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Product.find(
    { delist: false, isDeleted: false, "Departments._id": id },
    productList
  ).exec((err, products) => {
    if (err) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }

    if (products.length === 0) {
      return res.status(200).send({ products: [] });
    }

    let newProducts = products.map((v) => {
      const newProduct = {
        ...v._doc,
        thumbnail: v.images.filter((v) => v.isThumbnail === true)[0].fileUrl,
        reviewCount: v.Reviews.length,
        reviewAverage:
          v.Reviews.reduce((total, next) => total + next.rate, 0) /
          v.Reviews.length,
      };

      delete newProduct["Reviews"];
      delete newProduct["images"];
      return newProduct;
    });

    return res.status(200).send({ products: newProducts });
  });
};

exports.addProduct = async (req, res, next) => {
  if (!req.user?.Shop) {
    return res.status(400).send({
      message: "User hasn't set up their shop",
    });
  }

  let payload = req.body.payload;
  payload = JSON.parse(payload);
  const {
    name,
    imageSettings,
    Departments,
    description,
    specifications,
    isMultipleVariation,
    variationName,
    variations,
    price,
    stock,
  } = payload;

  if (!typeof isMultipleVariation === "boolean") {
    return res.status(400).send({
      message: "isMultipleVariation: Must be a boolean type",
    });
  }

  const prodInfoImages = req.files.prodInfoImages;
  const prodVariantImages = req.files.prodVariantImages;

  if (!prodInfoImages || (isMultipleVariation && !prodVariantImages)) {
    return res.status(400).send({
      message: "There was a problem uploading your form",
    });
  }

  let validation;
  let data = {};

  if (isMultipleVariation) {
    data = {
      name,
      imageSettings,
      Departments,
      description,
      specifications,
      isMultipleVariation,
      variationName,
      variations,
    };
    validation = productMultiVarValidator.safeParse({ ...data });
  } else {
    data = {
      name,
      imageSettings,
      Departments,
      description,
      specifications,
      isMultipleVariation,
      price,
      stock,
    };
    validation = productNonMultiVarValidator.safeParse({
      ...data,
    });
  }

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  if (
    imageSettings.length !== prodInfoImages.length ||
    (isMultipleVariation && prodVariantImages.length !== variations.length)
  ) {
    return res.status(400).send({
      message: "Please finish the form",
    });
  }

  Department.findOne({ _id: data.Departments[0] }).exec((err, dept) => {
    let newDept = [];
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!dept && dept.children.length > 0 && !data.Departments[1]) {
      return res.status(500).send({
        message: "Invalid department",
      });
    }

    newDept.push({ _id: dept._id, name: dept.name, parentId: null });

    const cDept1 = dept.children.filter(
      (v) => v._id.toHexString() === data.Departments[1]
    );

    if (
      (dept.children && cDept1.length === 0) ||
      (cDept1[0].children.length > 0 && !data.Departments[2])
    ) {
      return res.status(500).send({
        message: "Invalid department",
      });
    }

    newDept.push({
      _id: cDept1[0]._id,
      name: cDept1[0].name,
      parentId: dept._id,
    });

    if (cDept1[0].children && cDept1[0].children.length > 0) {
      const cDept2 = cDept1[0].children.filter(
        (v) => v._id.toHexString() === data.Departments[2]
      );
      if (cDept2.length === 0)
        return res.status(500).send({
          message: "Invalid department",
        });

      newDept.push({
        _id: cDept2[0]._id,
        name: cDept2[0].name,
        parentId: cDept1[0]._id,
      });
    }

    data.Departments = newDept;

    let fileUploads = [];

    const prodImageFileUpload = prodInfoImages.map((v) => {
      return {
        Body: v.buffer,
        Key: `${mediaFolderName}${uuidv4()}.${getFileExt(v.originalname)}`,
        ContentType: v.mimetype,
      };
    });

    fileUploads.push(prodImageFileUpload);

    if (isMultipleVariation) {
      const prodVariantImageUpload = prodVariantImages.map((v) => {
        return {
          Body: v.buffer,
          Key: `${mediaFolderName}${uuidv4()}.${getFileExt(v.originalname)}`,
          ContentType: v.mimetype,
        };
      });

      fileUploads.push(prodVariantImageUpload);
    }

    Promise.all(
      fileUploads.map(function (v1) {
        return Promise.all(
          v1.map(function (v2) {
            return new Promise(function (resolve, reject) {
              uploadFile(v2)
                .then((result) => resolve(result))
                .catch((err) => {
                  reject(err);
                });
            });
          })
        );
      })
    )
      .then((result) => {
        if (result.length !== fileUploads.length) {
          return res.status(500).send({
            message: "There was an error from submitting your form",
          });
        }

        let newProdImages = [];
        const prodImageLinks = result[0];

        if (data.imageSettings.length !== prodImageLinks.length) {
          return res.status(500).send({
            message: "There was an error from submitting your form",
          });
        }

        data.imageSettings.forEach((v, i) =>
          newProdImages.push({ isThumbnail: v, fileUrl: prodImageLinks[i] })
        );

        if (isMultipleVariation) {
          let newProdVariations = [];
          const prodVariantImageLinks = result[1];
          if (data.variations.length !== prodVariantImageLinks.length) {
            return res.status(500).send({
              message: "There was an error from submitting your form",
            });
          }

          data.variations.forEach((v, i) =>
            newProdVariations.push({ ...v, fileUrl: prodVariantImageLinks[i] })
          );

          data.variations = newProdVariations;
        }

        delete data["imageSettings"];
        data.images = newProdImages;

        const newProduct = new Product({
          ...data,
          Shop: req.user.Shop,
        });

        newProduct.save((err, product) => {
          if (err) {
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          }

          delete product._doc.Shop;
          delete product._doc.__v;
          delete product._doc.isDeleted;
          res.status(200).send({ product });
        });
      })
      .catch((err) => {
        return res.status(500).send({
          message: "Upload error",
        });
      });
  });
};

exports.getProduct = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "No Product Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Product.findOne(
    { _id: req.params.id, isDeleted: false, delist: false },
    productDisplay
  ).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product) {
      return res.status(404).send({ product: null });
    }
    product
      .populate("Shop", "-updatedAt -createdAt -__v")
      .then((data) => {
        return res.status(200).send({ product });
      })
      .catch((err) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });
      });
  });
};

exports.getOwnProduct = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "No Product Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Product.findOne(
    { _id: req.params.id, isDeleted: false, delist: false },
    productDisplay
  ).exec((err, product) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!product) {
      return res.status(404).send({ product: null });
    }

    return res.status(200).send({ product });
  });
};

exports.getShopProducts = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Product.find(
    { delist: false, isDeleted: false, Shop: req.params.id },
    productList
  ).exec((err, products) => {
    if (err) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }

    if (products.length === 0) {
      return res.status(404).send({ products: [] });
    }

    let newProducts = products.map((v) => {
      const newProduct = {
        ...v._doc,
        thumbnail: v.images.filter((v) => v.isThumbnail === true)[0].fileUrl,
      };
      delete newProduct["images"];
      return newProduct;
    });

    return res.status(200).send({ products: newProducts });
  });
};

exports.updateProduct = (req, res, next) => {
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
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  let payload = req.body.payload;
  payload = JSON.parse(payload);
  const {
    resetImages,
    oldImagesSettings,
    newImagesSettings,
    name,
    Departments,
    description,
    specifications,
    isMultipleVariation,
    variationName,
    resetVariants,
    oldVariations,
    newVariations,
    price,
    stock,
  } = payload;

  if (!typeof isMultipleVariation === "boolean") {
    return res.status(400).send({
      message: "isMultipleVariation: Must be a boolean type",
    });
  }

  // const prodInfoImages = req.files.prodInfoImages;
  // const prodVariantImages = req.files.prodVariantImages;

  // if (!prodInfoImages || (isMultipleVariation && !prodVariantImages)) {
  //   return res.status(400).send({
  //     message: "There was a problem uploading your form",
  //   });
  // }

  let validation;
  let data = {};

  if (isMultipleVariation) {
    data = {
      name,
      resetImages,
      oldImagesSettings,
      newImagesSettings,
      Departments,
      description,
      specifications,
      isMultipleVariation,
      variationName,
      resetVariants,
      oldVariations,
      newVariations,
    };
    validation = productMultiVarUpdateValidator.safeParse({ ...data });
  } else {
    data = {
      name,
      resetImages,
      oldImagesSettings,
      newImagesSettings,
      Departments,
      description,
      specifications,
      isMultipleVariation,
      price,
      stock,
    };
    validation = productNonMultiVarUpdateValidator.safeParse({
      ...data,
    });
  }

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  const newProdImages = req.files.newProdImages;
  const oldVariationsNewImage = req.files.oldVariationsNewImage;
  const newVariationsImage = req.files.newVariationsImage;

  let newProductImagesSettings = [];
  let newFinalVariations = [];
  let finalData = {};

  let fileUploads = [];

  if (resetVariants && !newVariationsImage && !data.newVariations) {
    return res.status(500).send({
      message: "There was an error submitting your request",
    });
  }

  Product.findOne(
    { _id: req.params.id, isDeleted: false },
    "-isDeleted -__v"
  ).exec((err, product) => {
    if (err || !product)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    let oldVarImgLt = 0;
    if (data.oldVariations) {
      oldVarImgLt = data.oldVariations.filter((v) => v.newImage).length;
    }
    if (
      oldVariationsNewImage &&
      !data.oldVariations &&
      data.oldVarImgLt !== oldVariationsNewImage.length()
    ) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }
    new Promise(function (resolve, reject) {
      if (data.Departments) {
        Department.findOne({ _id: Departments[0] }).exec((err, dept) => {
          let newDept = [];
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          if (!dept || (dept.children.length > 0 && !data.Departments[1])) {
            return res.status(500).send({
              message: "Invalid department",
            });
          }

          newDept.push({ _id: dept._id, name: dept.name, parentId: null });
          const cDept1 = dept.children.filter(
            (v) => v._id.toHexString() === data.Departments[1]
          );

          if (
            (dept.children && cDept1.length === 0) ||
            (cDept1[0].children.length > 0 && !data.Departments[2])
          ) {
            return res.status(500).send({
              message: "Invalid department",
            });
          }

          newDept.push({
            _id: cDept1[0]._id,
            name: cDept1[0].name,
            parentId: dept._id,
          });

          if (cDept1[0].children && cDept1[0].children.length > 0) {
            const cDept2 = cDept1[0].children.filter(
              (v) => v._id.toHexString() === data.Departments[2]
            );
            if (cDept2.length === 0)
              return res.status(500).send({
                message: "Invalid department",
              });

            newDept.push({
              _id: cDept2[0]._id,
              name: cDept2[0].name,
              parentId: cDept1[0]._id,
            });
          }

          finalData.Departments = newDept;

          resolve();
        });
      } else {
        resolve();
      }
    })
      .then(() => {
        if (!data.resetImages) {
          if (data.newImagesSettings) {
            if (data.newImagesSettings.includes(true)) {
              product._doc.images.forEach((v) => {
                newProductImagesSettings.push({
                  ...v._doc,
                  isThumbnail: false,
                });
              });
            }
          }

          if (newProductImagesSettings.length === 0) {
            if (data.oldImagesSettings) {
              product._doc.images.forEach((v) => {
                const filtered = data.oldImagesSettings.filter(
                  ({ _id: id }) => id === v._doc._id.toHexString()
                );
                if (filtered.length > 0) {
                  newProductImagesSettings.push({
                    ...v._doc,
                    isThumbnail: filtered[0].isThumbnail,
                  });
                }
              });
            }
          }
        }

        if (
          newProdImages &&
          data.newImagesSettings &&
          newProdImages.length !== data.newImagesSettings.length
        ) {
          throw new Error("There was an error submitting your request");
        }

        if (newProdImages) {
          const newProdImageFileUpload = newProdImages.map((v) => {
            return {
              Body: v.buffer,
              Key: `${mediaFolderName}${uuidv4()}.${getFileExt(
                v.originalname
              )}`,
              ContentType: v.mimetype,
            };
          });
          fileUploads.push(newProdImageFileUpload);
        } else {
          fileUploads.push([]);
        }

        if (data.isMultipleVariation) {
          if (data.oldVariations && !data.resetVariants) {
            product._doc.variations.forEach((v) => {
              const filtered = oldVariations.filter(
                ({ _id: id }) => id === v._doc._id.toHexString()
              );
              if (filtered.length > 0) {
                newFinalVariations.push({
                  ...v._doc,
                  ...filtered[0],
                });
              }
            });
          }

          if (
            data.oldVariations &&
            !data.resetVariants &&
            oldVariationsNewImage
          ) {
            const newOldVariantNewImage = oldVariationsNewImage.map((v) => {
              return {
                Body: v.buffer,
                Key: `${mediaFolderName}${uuidv4()}.${getFileExt(
                  v.originalname
                )}`,
                ContentType: v.mimetype,
              };
            });
            fileUploads.push(newOldVariantNewImage);
          } else {
            fileUploads.push([]);
          }

          if (data.newVariations && newVariationsImage) {
            const newImages = newVariationsImage.map((v) => {
              return {
                Body: v.buffer,
                Key: `${mediaFolderName}${uuidv4()}.${getFileExt(
                  v.originalname
                )}`,
                ContentType: v.mimetype,
              };
            });
            fileUploads.push(newImages);
          } else {
            fileUploads.push([]);
          }
        }

        return Promise.all(
          fileUploads.map(function (v1) {
            return Promise.all(
              v1.map(function (v2) {
                return new Promise(function (resolve, reject) {
                  uploadFile(v2)
                    .then((result) => resolve(result))
                    .catch((err) => {
                      reject(err);
                    });
                });
              })
            );
          })
        );
      })
      .then((imgUpload) => {
        if (
          newProdImages &&
          (imgUpload[0].length === 0 ||
            imgUpload[0].length !== data.newImagesSettings.length)
        )
          throw new Error("There was an error submitting your request");

        if (newProdImages) {
          if (newProductImagesSettings.length === 0 && !data.resetImages) {
            newProductImagesSettings = [...product._doc.images];
          }
          const prodImgUrls = imgUpload[0];
          data.newImagesSettings.forEach((v, i) => {
            newProductImagesSettings.push({
              isThumbnail: v,
              fileUrl: prodImgUrls[i],
            });
          });
        }

        if (newProductImagesSettings.length > 0) {
          finalData.images = newProductImagesSettings;
        }

        if (isMultipleVariation) {
          if (!product._doc.isMultipleVariation) {
            finalData.isMultipleVariation = true;
            finalData.stock = null;
            finalData.price = null;
          }

          if (oldVariationsNewImage && !data.resetVariants) {
            if (
              oldVariationsNewImage &&
              (imgUpload[1].length === 0 || oldVarImgLt !== imgUpload[1].length)
            )
              throw new Error("There was an error submitting your request");
          }

          if (
            data.newVariations &&
            newVariationsImage &&
            (imgUpload[2]?.length === 0 ||
              imgUpload[2].length !== data.newVariations.length)
          )
            throw new Error("There was an error submitting your request");

          if (oldVariationsNewImage && !resetVariants) {
            let newImagesUrl = imgUpload[1];
            let oldVarImgIndex = 0;
            newFinalVariations = newFinalVariations.map((v) => {
              let data = {
                ...v,
              };
              if (data.newImage) {
                data.fileUrl = newImagesUrl[oldVarImgIndex];
                oldVarImgIndex = +1;
                delete data["newImage"];
              }
              return data;
            });
          }

          if (newVariationsImage) {
            let newImagesUrl = imgUpload[2];
            if (!data.oldVariations && !resetVariants) {
              newFinalVariations = [...product._doc.variations];
            }

            const newSetVariations = data.newVariations.map((v, i) => {
              return { ...v, fileUrl: newImagesUrl[i] };
            });
            newFinalVariations = [...newFinalVariations, ...newSetVariations];
          }

          if (newFinalVariations.length > 0) {
            finalData.variations = newFinalVariations;
          }

          if (data.variationName) finalData.variationName = data.variationName;
        } else {
          if (product._doc.isMultipleVariation) {
            finalData.isMultipleVariation = false;
            finalData.variations = [];
            finalData.variationName = null;
          }

          finalData.price = data.price;
          finalData.stock = data.stock;
        }

        finalData.name = data.name;
        finalData.description = data.description;
        finalData.specifications = data.specifications;

        Product.findOneAndUpdate({ _id: req.params.id }, finalData, {
          new: true,
        }).exec((err, newProduct) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          delete newProduct._doc.createdAt;
          delete newProduct._doc.updatedAt;
          delete newProduct._doc.__v;
          delete newProduct._doc.isDeleted;
          return res.status(200).send({ product: newProduct._doc });
        });
      })
      .catch((err) => {
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      });
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
    return res.status(404).send({
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
    return res.status(404).send({
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

  User.findOne({ _id: req.user.id }).exec((err, user) => {
    if (err) {
      return res.status(500).send({
        message: "There was an error submitting your request",
      });
    }

    if (!user) {
      return res.status(401).send({ message: "No user found" });
    }

    const newReview = new ProductReview({
      userId: req.user.id,
      name: user._doc.name,
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
    return res.status(404).send({
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
    return res.status(404).send({
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
