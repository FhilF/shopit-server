const { isValidObjectId } = require("mongoose");
const {
    shopAddValidator,
    shopUpdateValidator,
  } = require("../scripts/schemaValidators/shop"),
  db = require("../models"),
  orderStatus = require("../lib/orderStatus");

const User = db.user,
  Shop = db.shop,
  Order = db.order,
  Product = db.product;

exports.getShop = (req, res, next) => {
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

exports.addShop = async (req, res, next) => {
  const { name, address, phoneNumber, category, telephoneNumber } = req.body;

  const validation = shopAddValidator.safeParse({
    name,
    address,
    phoneNumber,
    category,
    telephoneNumber,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
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
      return res.status(400).send({
        message: "User already has an existing shop.",
      });

    const newShop = new Shop({
      name,
      address,
      phoneNumber,
      category,
      telephoneNumber,
    });

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
  });
};

exports.updateShop = async (req, res, next) => {
  const { name, address, phoneNumber, category, telephoneNumber } = req.body;
  const validation = shopUpdateValidator.safeParse({
    name,
    address,
    phoneNumber,
    category,
    telephoneNumber,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
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
        newAddress = { ...user._doc.Shop._doc.address._doc, ...address };
      }

      Shop.findOneAndUpdate(
        { _id: user._doc.Shop._id },
        { name, address: newAddress, phoneNumber, category, telephoneNumber },
        { new: true }
      ).exec((err, shop) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        delete shop._doc.updatedAt;
        delete shop._doc.__v;

        res.status(200).send({ Shop: shop._doc });
      });
    });
};

exports.cancelOrder = async (req, res, next) => {
  const { id } = req.params;
  const { updateproduct } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(500).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({
    _id: id,
    "Shop._id": req.user.Shop,
    isCancelled: false,
    isShipped: true,
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

    order.Shop.Orders.map((val) => {
      productsForUpdate.push({
        updateOne: {
          filter: { _id: val._id },
          update: { $inc: { stock: val.orderQty } },
        },
      });
    });

    order.updateOne(
      {
        isCancelled: true,
        $push: {
          StatusLog: orderStatus.find((el) => {
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
          if (updateproduct === "1") {
            Product.bulkWrite(productsForUpdate, (err, newProducts) => {
              if (err) reject(err);
              resolve();
            });
          }
          resolve();
        })
          .then(() => {
            return res.status(200).send({
              message: "Successfully cancelled your order",
            });
          })
          .catch((err) => {
            console.log(err);
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
    return res.status(500).send({
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
          StatusLog: orderStatus.find((el) => {
            return el.code === 3;
          }),
        },
      },
      (err, newOrder) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({
          message: "Successfully updated order",
        });
      }
    );
  });
};

exports.shipOrder = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(500).send({
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
        $push: {
          StatusLog: orderStatus.find((el) => {
            return el.code === 4;
          }),
        },
      },
      (err, newOrder) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({
          message: "Successfully updated order",
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
