const { isValidObjectId, Types } = require("mongoose"),
  { v4: uuidv4 } = require("uuid");
const { shopImageFolderName } = require("../config");
const { getAddressValue } = require("../lib/address");
const { unsetShopPreview } = require("../scripts/aggregationDataReturn/shop");
const { ownShopProductList } = require("../scripts/modelDataReturn/product");
const {
    shopAddValidator,
    shopUpdateValidator,
  } = require("../scripts/schemaValidators/shop"),
  db = require("../models"),
  orderStatus = require("../lib/orderStatus"),
  { uploadFile } = require("../services/aws"),
  { getFileExt } = require("../scripts/helper");

const User = db.user,
  Shop = db.shop,
  Order = db.order,
  Product = db.product;

exports.getShopInfo = (req, res, next) => {
  let id = req.params.id;
  if (!id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  id = Types.ObjectId(id);

  Shop.aggregate(
    [
      { $match: { _id: id } },
      {
        $lookup: {
          from: "products",
          let: {
            id: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$Shop", "$$id"],
                },
                $or: [
                  { isMultipleVariation: false, stock: { $gt: 0 } },
                  {
                    isMultipleVariation: true,
                    $expr: { $gt: [{ $max: "$variations.stock" }, 0] },
                  },
                ],
              },
            },
            {
              $addFields: {
                thumbnail: {
                  $first: {
                    $filter: {
                      input: "$images",
                      as: "image",
                      cond: {
                        $eq: ["$$image.isThumbnail", true],
                      },
                    },
                  },
                },
                mixMaxPrice: {
                  $cond: {
                    if: { $eq: ["$isMultipleVariation", true] },
                    then: {
                      minPrice: { $min: "$variations.price" },
                      maxPrice: { $max: "$variations.price" },
                    },
                    else: null,
                  },
                },
              },
            },
            { $set: { thumbnail: "$thumbnail.fileUrl" } },
          ],

          as: "Products",
        },
      },

      {
        $set: {
          ProductCopies: "$Products",
        },
      },
      { $unwind: "$ProductCopies" },

      {
        $set: {
          second_element: { $arrayElemAt: ["$ProductCopies.Departments", 0] },
        },
      },
      { $unwind: "$second_element" },
      {
        $group: {
          _id: { name: "$second_element.name", _id: "$second_element._id" },
          Shop: { $first: "$$ROOT" },
        },
      },
      {
        $group: {
          // _id: { $first: "$Shop" },
          _id: 0,
          Departments: { $push: "$_id" },
          Shop: { $first: "$Shop" },
        },
      },
      {
        $project: {
          Shop: {
            $mergeObjects: [
              "$Shop",
              {
                Departments: {
                  $sortArray: { input: "$Departments", sortBy: { name: 1 } },
                },
              },
            ],
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$Shop",
        },
      },
      {
        $unset: [...unsetShopPreview, "second_element", "ProductCopies"],
      },
    ],

    (err, aggregation) => {
      if (err) {
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      }

      if (aggregation.length === 0)
        return res.status(404).send({
          message: "No Shop Found",
        });

      let newShop = aggregation[0];

      return res.status(200).send({ Shop: newShop });
    }
  );
};

exports.getOrder = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send({
      message: "No Shop Id",
    });
  }

  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({
    "Shop._id": req.user.Shop,
    _id: id,
    isDeleted: false,
  }).exec((err, order) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!order) {
      return res.status(404).send({ message: "No order found" });
    }

    return res.status(200).send({
      Order: order,
    });
  });
};

exports.getOrderList = (req, res, next) => {
  const { order_type } = req.query;
  const query = () => {
    if (order_type === "1")
      return {
        isCancelled: true,
        isAccepted: false,
        isShipped: false,
        isDelivered: false,
      };

    if (order_type === "2")
      return {
        isCancelled: false,
        isAccepted: false,
        isShipped: false,
        isDelivered: false,
      };

    if (order_type === "3")
      return {
        isCancelled: false,
        isAccepted: true,
        isShipped: false,
        isDelivered: false,
      };

    if (order_type === "4")
      return {
        isCancelled: false,
        isAccepted: true,
        isShipped: true,
        isDelivered: false,
      };

    if (order_type === "5")
      return {
        isCancelled: false,
        isAccepted: true,
        isShipped: true,
        isDelivered: true,
      };

    return {};
  };

  Order.find({
    "Shop._id": req.user.Shop,
    isDeleted: false,
    ...query(),
  }).exec((err, orderList) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    return res.status(200).send({
      Orders: orderList,
    });
  });
};

exports.getOwnShop = (req, res, next) => {
  User.findOne({ username: req.user.username })
    .populate("Shop", "-updatedAt -createdAt -__v")
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!user)
        return res.status(404).send({
          message: "User doesn't exist",
        });

      if (!user._doc.Shop)
        return res.status(404).send({
          message: "User hasn't set up their shop",
        });

      res.status(200).send({ Shop: user._doc.Shop });
    });
};

exports.getOwnProducts = (req, res, next) => {
  if (!req.user.Shop) {
    return res.status(404).send({
      message: "User hasn't set up their shop",
    });
  }

  Product.find(
    { Shop: req.user.Shop, delist: false, isDeleted: false },
    ownShopProductList
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

exports.addShop = async (req, res, next) => {
  let payload = req.body.payload;
  payload = JSON.parse(payload);

  const {
    name,
    description,
    shopRepresentative,
    phoneNumber,
    address,
    telephoneNumber,
  } = payload;

  const validation = shopAddValidator.safeParse({
    name,
    description,
    shopRepresentative,
    phoneNumber,
    address,
    telephoneNumber,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  let shopImage;
  if (req.file) {
    shopImage = req.file;
  }

  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!user)
      return res.status(404).send({
        message: "User doesn't exist",
      });

    if (user.Shop)
      return res.status(401).send({
        message: "User already has an existing shop.",
      });

    return new Promise(function (resolve, reject) {
      if (shopImage) {
        const uploadData = {
          Body: shopImage.buffer,
          Key: `${shopImageFolderName}${uuidv4()}.${getFileExt(
            shopImage.originalname
          )}`,
          ContentType: shopImage.mimetype,
        };
        uploadFile(uploadData)
          .then((result) => resolve(result))
          .catch((err) => {
            reject(err);
          });
      } else {
        resolve();
      }
    })
      .then((result) => {
        let data = {};
        const newAddress = {
          country: "PH",
          region: getAddressValue(address.region, "region", "id", "label"),
          province: getAddressValue(
            address.province,
            "province",
            "id",
            "label"
          ),
          city: getAddressValue(address.city, "city", "id", "label"),
          barangay: getAddressValue(
            address.barangay,
            "barangay",
            "id",
            "label"
          ),
          zipCode: address.zipCode,
          addressLine1: address.addressLine1,
        };
        if (result) {
          data = {
            name,
            description,
            shopRepresentative,
            phoneNumber,
            address: newAddress,
            telephoneNumber,
            imageUrl: result,
          };
        } else {
          data = {
            name,
            description,
            shopRepresentative,
            phoneNumber,
            address: newAddress,
            telephoneNumber,
          };
        }
        const newShop = new Shop(data);

        return newShop.save((err, shop) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          user.Shop = newShop._doc._id;

          user.save((err, user) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });
            user
              .populate("Shop", "-updatedAt -createdAt -__v")
              .then((user) => {
                delete user._doc.__v;
                delete user._doc.password;

                req.user.Shop = user._doc.Shop._id;
                return res.status(200).send({ Shop: user._doc.Shop });
              })
              .catch((err) => {
                if (err)
                  return res.status(500).send({
                    message: "There was an error submitting your request",
                  });
              });
          });
        });
      })
      .catch((err) => {
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      });
  });
};

exports.updateShop = async (req, res, next) => {
  let payload = req.body.payload;
  payload = JSON.parse(payload);

  const {
    name,
    description,
    shopRepresentative,
    phoneNumber,
    address,
    telephoneNumber,
  } = payload;

  const validation = shopUpdateValidator.safeParse({
    name,
    description,
    shopRepresentative,
    phoneNumber,
    address,
    telephoneNumber,
  });
  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  let shopImage;
  if (req.file) {
    shopImage = req.file;
  }

  User.findOne({ username: req.user.username })
    .populate("Shop", "-updatedAt -createdAt -__v")
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!user)
        return res.status(404).send({
          message: "User doesn't exist",
        });

      if (!user._doc.Shop)
        return res.status(404).send({
          message: "User hasn't set up their shop",
        });

      let newAddress = undefined;

      if (address) {
        newAddress = {
          ...user._doc.Shop._doc.address._doc,
          country: "PH",
          region: getAddressValue(address.region, "region", "id", "label"),
          province: getAddressValue(
            address.province,
            "province",
            "id",
            "label"
          ),
          city: getAddressValue(address.city, "city", "id", "label"),
          barangay: getAddressValue(
            address.barangay,
            "barangay",
            "id",
            "label"
          ),
          zipCode: address.zipCode,
          addressLine1: address.addressLine1,
        };
      }

      return new Promise(function (resolve, reject) {
        if (shopImage) {
          const uploadData = {
            Body: shopImage.buffer,
            Key: `${shopImageFolderName}${uuidv4()}.${getFileExt(
              shopImage.originalname
            )}`,
            ContentType: shopImage.mimetype,
          };
          uploadFile(uploadData)
            .then((result) => resolve(result))
            .catch((err) => {
              reject(err);
            });
        } else {
          resolve();
        }
      })
        .then((result) => {
          let data = {};
          if (result) {
            data = {
              name,
              description,
              shopRepresentative,
              phoneNumber,
              address: newAddress,
              telephoneNumber,
              imageUrl: result,
            };
          } else {
            data = {
              name,
              description,
              shopRepresentative,
              phoneNumber,
              address: newAddress,
              telephoneNumber,
            };
          }
          Shop.findOneAndUpdate({ _id: user._doc.Shop._id }, data, {
            new: true,
          }).exec((err, shop) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            delete shop._doc.createdAt;
            delete shop._doc.updatedAt;
            delete shop._doc.__v;

            res.status(200).send({ Shop: shop._doc });
          });
        })
        .catch((err) => {
          return res.status(500).send({
            message: "There was an error submitting your request",
          });
        });
    });
};

exports.cancelOrder = async (req, res, next) => {
  const { id } = req.params;
  const { updateproduct } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({
    _id: id,
    "Shop._id": req.user.Shop,
    isCancelled: false,
    isShipped: false,
  }).exec((err, order) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!order)
      return res.status(404).send({
        message: "Order not found",
      });

    const productsForUpdate = [];

    order.Shop.Orders.map((v) => {
      const item = v._doc;
      productsForUpdate.push({
        updateOne: {
          filter: {
            _id: item._id,
            "variations._id": item.variationId,
          },
          update: { $inc: { "variations.$.stock": +item.qty } },
        },
      });
    });

    order.updateOne(
      {
        isCancelled: true,
        $push: {
          statusLog: orderStatus.find((el) => {
            return el.code === 22;
          }),
        },
      },
      (err, newOrder) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return new Promise((resolve, reject) => {
          if (updateproduct !== "1") {
            Product.bulkWrite(productsForUpdate, (err, newProducts) => {
              if (err) reject(err);
              resolve();
            });
          }
          resolve();
        })
          .then(() => {
            const newOrder = {
              ...order._doc,
              isCancelled: true,
              statusLog: [
                ...order.statusLog,
                ...orderStatus.filter((v) => {
                  return v.code === 22;
                }),
              ],
            };
            return res.status(200).send({
              Order: newOrder,
            });
          })
          .catch((err) => {
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          });
      }
    );
  });
};

exports.acceptOrder = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({
    _id: id,
    "Shop._id": req.user.Shop,
    isCancelled: false,
    isAccepted: false,
  }).exec((err, order) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!order)
      return res.status(404).send({
        message: "Order not found",
      });

    order.updateOne(
      {
        isAccepted: true,
        $push: {
          statusLog: orderStatus.find((el) => {
            return el.code === 2;
          }),
        },
      },
      (err) => {
        const newOrder = {
          ...order._doc,
          isAccepted: true,
          statusLog: [
            ...order.statusLog,
            ...orderStatus.filter((v) => {
              return v.code === 2;
            }),
          ],
        };

        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({
          Order: newOrder,
        });
      }
    );
  });
};

exports.shipOrder = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({
    _id: id,
    "Shop._id": req.user.Shop,
    isCancelled: false,
    isAccepted: true,
    isShipped: false,
  }).exec((err, order) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!order)
      return res.status(404).send({
        message: "Order not found",
      });

    order.updateOne(
      {
        isShipped: true,
        isDelivered: true,
        $push: {
          statusLog: [
            {
              ...orderStatus.find((el) => {
                return el.code === 3;
              }),
              timestamp: new Date(),
            },
            {
              ...orderStatus.find((el) => {
                return el.code === 4;
              }),
              timestamp: new Date(),
            },
          ],
        },
      },
      (err) => {
        const newOrder = {
          ...order._doc,
          isShipped: true,
          isDelivered: true,
          statusLog: [
            ...order.statusLog,
            ...orderStatus.filter((v) => {
              return v.code === 3;
            }),
            ...orderStatus.filter((v) => {
              return v.code === 4;
            }),
          ],
        };

        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({
          Order: newOrder,
        });
      }
    );
  });
};

// exports.deleteShop = async (req, res, next) => {
//   try {
//     const user = await User.findOne({ username: req.user.username }).populate(
//       "Shop",
//       "-updatedAt -createdAt -__v"
//     );

//   } catch (error) {
//     return res.status(500).send({
//       message: "There was an error submitting your request",
//     });
//   }
// };
