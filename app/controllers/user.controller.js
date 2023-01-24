const { isValidObjectId, Types } = require("mongoose"),
  _ = require("lodash"),
  { v4: uuidv4 } = require("uuid");
const Courier = require("../models/Courier");
const {
    userAddressValidator,
    userOrderValidator,
    accountUpdateValidator,
  } = require("../scripts/schemaValidators/user"),
  db = require("../models"),
  { getAddressValue } = require("../lib/address");

const { avatarFolderName } = require("../config"),
  { uploadFile } = require("../services/aws"),
  { getFileExt } = require("../scripts/helper");

const User = db.user,
  Address = db.address,
  Product = db.product,
  Order = db.order;

exports.getUser = async (req, res, next) => {
  return res.status(200).send({
    message: "There was an error submitting your request",
  });
};

exports.getSessionedUser = (req, res, next) => {
  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    let sessionedUser = user._doc;
    sessionedUser.Addresses = sessionedUser.Addresses.filter(
      (v) => !v.isDeleted
    );

    ["Roles", "Shop", "createdAt", "updatedAt", "__v", "password"].forEach(
      (v) => {
        delete sessionedUser[v];
      }
    );
    return res.status(200).send({ sessionedUser });
  });
};

exports.updateAccountProfile = (req, res, next) => {
  let payload = req.body.payload;
  if (!payload) {
    return res.status(500).send({
      message: "No payload!",
    });
  }

  payload = JSON.parse(payload);
  const { name } = payload;
  const validation = accountUpdateValidator.safeParse({ name });
  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  const avatar = req.file;
  if (!name && !avatar) {
    return res.status(500).send({
      message: "No new update",
    });
  }
  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    return new Promise(function (resolve, reject) {
      if (avatar) {
        const uploadData = {
          Body: avatar.buffer,
          Key: `${avatarFolderName}${uuidv4()}.${getFileExt(
            avatar.originalname
          )}`,
          ContentType: avatar.mimetype,
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
        const newUpdates = { name };
        if (result) newUpdates.avatar = result;
        user
          .updateOne(
            {
              ...newUpdates,
            },
            {
              new: true,
            }
          )
          .exec((err, user) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            return res.status(200).send({ profile: newUpdates });
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.updateAccountEmail = (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).send({
      message: "Invalid email",
    });

  const validation = accountUpdateValidator.safeParse({ email });
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

    user
      .updateOne(
        {
          email,
        },
        {
          new: true,
        }
      )
      .exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({ newEmail: email });
      });
  });
};

exports.updateAccountPhoneNumber = (req, res, next) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber?.number && !phoneNumber?.countryCode)
    return res.status(400).send({
      message: "Invalid phone number",
    });

  const validation = accountUpdateValidator.safeParse({ phoneNumber });
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

    user
      .updateOne(
        {
          phoneNumber,
        },
        {
          new: true,
        }
      )
      .exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({ newPhoneNumber: phoneNumber });
      });
  });
};

exports.getAddress = (req, res, next) => {
  User.aggregate(
    [
      { $match: { username: req.user.username } },
      {
        $project: {
          username: 1,
          Addresses: {
            $filter: {
              input: "$Addresses",
              as: "address",
              cond: { $eq: ["$$address.isDeleted", false] },
            },
          },
        },
      },
    ],

    (err, aggregation) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      const userAddresses = aggregation[0].Addresses
        ? aggregation[0].Addresses
        : [];

      if (userAddresses.length === 0) {
        return res.status(404).send({
          Addresses: [],
        });
      }
      return res.status(200).send({ Addresses: userAddresses });
    }
  );
};

exports.addAddress = async (req, res, next) => {
  const { address } = req.body;
  if (!address)
    return res.status(400).send({
      message: "Missing Parameter",
    });

  const validation = userAddressValidator.safeParse(address);
  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  const newUserAddress = {
    ...address,
    country: "PH",
    region: getAddressValue(address.region, "region", "id", "label"),
    province: getAddressValue(address.province, "province", "id", "label"),
    city: getAddressValue(address.city, "city", "id", "label"),
    barangay: getAddressValue(address.barangay, "barangay", "id", "label"),
    zipCode: address.zipCode,
    addressLine1: address.addressLine1,
  };

  const aggregateOptions = [
    { $match: { username: req.user.username } },
    {
      $project: {
        username: 1,
        Addresses: {
          $filter: {
            input: "$Addresses",
            as: "address",
            cond: { $eq: ["$$address.isDeleted", false] },
          },
        },
      },
    },
  ];

  User.aggregate(
    aggregateOptions,

    (err, aggregation) => {
      if (err || aggregation.length !== 1)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      const userAddresses = aggregation[0].Addresses
        ? aggregation[0].Addresses
        : [];
      if (userAddresses.length > 4) {
        return res.status(400).send({
          message:
            "You have already reach the max limit of 5 Addresses per user",
        });
      }

      if (!address.isDefault && userAddresses.length === 0) {
        return res.status(400).send({
          message: "First address should be default",
        });
      }

      const newAddress = new Address(newUserAddress);

      if (address.isDefault && userAddresses.length > 0) {
        return User.findOneAndUpdate(
          { username: req.user.username },
          {
            $set: {
              // "Addresses.$[].isDefault": false - update all
              "Addresses.$[element].isDefault": false,
            },
          },
          {
            arrayFilters: [
              { "element.isDefault": true, "element.isDeleted": false },
            ],
          }
        ).exec((err, user) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          user
            .updateOne(
              {
                $push: { Addresses: newAddress._doc },
              },
              {
                new: true,
              }
            )
            .exec((err, user) => {
              if (err)
                return res.status(500).send({
                  message: "There was an error submitting your request",
                });
              User.aggregate(
                [...aggregateOptions, { $unset: ["Addresses.isDeleted"] }],
                (err, aggregation) => {
                  if (err)
                    return res.status(500).send({
                      message: "There was an error submitting your request",
                    });
                  return res
                    .status(200)
                    .send({ Addresses: aggregation[0]?.Addresses });
                }
              );
            });
        });
      }

      return User.findOneAndUpdate(
        { username: req.user.username },
        {
          $push: { Addresses: newAddress._doc },
        },
        {
          new: true,
        }
      ).exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });
        return User.aggregate(
          [...aggregateOptions, { $unset: ["Addresses.isDeleted"] }],
          (err, aggregation) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });
            return res
              .status(200)
              .send({ Addresses: aggregation[0]?.Addresses });
          }
        );
      });
    }
  );
};

exports.updateAddress = (req, res, next) => {
  const { address } = req.body;
  if (!address)
    return res.status(400).send({
      message: "Missing Parameter",
    });

  if (!req.params.id)
    return res.status(400).send({
      message: "Invalid Parameter",
    });

  const id = req.params.id;

  if (!isValidObjectId(id))
    return res.status(404).send({
      message: "Invalid Id",
    });

  const validation = userAddressValidator.safeParse(address);

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  const newUserAddress = {
    ...address,
    country: "PH",
    region: getAddressValue(address.region, "region", "id", "label"),
    province: getAddressValue(address.province, "province", "id", "label"),
    city: getAddressValue(address.city, "city", "id", "label"),
    barangay: getAddressValue(address.barangay, "barangay", "id", "label"),
  };

  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    const aggregateOptions = [
      { $match: { username: req.user.username } },
      {
        $project: {
          username: 1,
          Addresses: {
            $filter: {
              input: "$Addresses",
              as: "address",
              cond: { $eq: ["$$address.isDeleted", false] },
            },
          },
        },
      },
    ];

    let addresses = user._doc.Addresses;

    const match = addresses.find((o) => o._id.toHexString() === id);

    if (!match) {
      return res.status(404).send({ message: "Address Record does not exist" });
    }

    if (match._doc.isDeleted)
      return res
        .status(500)
        .send({ message: "There was an error submitting your request" });

    const matchIndex = addresses.findIndex((v) => v._id.toHexString() === id);

    if (!address.isDefault && match._doc.isDefault) {
      return res
        .status(500)
        .send({ message: "There was an error submitting your request" });
    }

    if (address.isDefault && !match._doc.isDefault) {
      addresses = addresses.map((v) => {
        return { ...v._doc, isDefault: false };
      });
    }

    addresses[matchIndex] = { ...match._doc, ...newUserAddress };

    return user.updateOne({ Addresses: addresses }).exec((err) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      return User.aggregate(
        [...aggregateOptions, { $unset: ["Addresses.isDeleted"] }],
        (err, aggregation) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          return res.status(200).send({ Addresses: aggregation[0]?.Addresses });
        }
      );
    });
  });
};

exports.updateDefaultAddress = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    const aggregateOptions = [
      { $match: { username: req.user.username } },
      {
        $project: {
          username: 1,
          Addresses: {
            $filter: {
              input: "$Addresses",
              as: "address",
              cond: { $eq: ["$$address.isDeleted", false] },
            },
          },
        },
      },
    ];

    const match = user._doc.Addresses.find((o) => o._id.toHexString() === id);
    if (!match) {
      return res.status(404).send({ message: "Address Record does not exist" });
    }

    if (match.isDefault)
      return res.status(400).send({ message: "Address is already default" });

    if (match.isDeleted)
      return res
        .status(500)
        .send({ message: "There was an error submitting your request" });

    return user
      .updateOne(
        {
          $set: {
            // "Addresses.$[].isDefault": false - update all
            "Addresses.$[element].isDefault": false,
          },
        },
        {
          arrayFilters: [
            { "element.isDefault": true, "element.isDeleted": false },
          ],
        }
      )
      .exec((err) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        user
          .updateOne(
            {
              $set: {
                "Addresses.$[element].isDefault": true,
              },
            },
            {
              arrayFilters: [{ "element._id": Types.ObjectId(id) }],
            }
          )
          .exec((err, user) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            return User.aggregate(
              [...aggregateOptions, { $unset: ["Addresses.isDeleted"] }],
              (err, aggregation) => {
                if (err)
                  return res.status(500).send({
                    message: "There was an error submitting your request",
                  });
                return res
                  .status(200)
                  .send({ Addresses: aggregation[0]?.Addresses });
              }
            );
          });
      });
  });
};

exports.deleteAddress = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }
  const id = req.params.id;

  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  const aggregateOptions = [
    { $match: { username: req.user.username } },
    {
      $project: {
        username: 1,
        Addresses: {
          $filter: {
            input: "$Addresses",
            as: "address",
            cond: { $eq: ["$$address.isDeleted", false] },
          },
        },
      },
    },
  ];

  User.findOne({ username: req.user.username }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    const match = user._doc.Addresses.find((o) => o._id.toHexString() === id);
    if (!match) {
      return res.status(404).send({ message: "Address Record does not exist" });
    }

    if (match.isDefault)
      return res
        .status(400)
        .send({ message: "Default address cannot be deleted" });

    if (match.isDeleted)
      return res
        .status(500)
        .send({ message: "There was an error submitting your request" });

    return user
      .updateOne(
        {
          $set: {
            "Addresses.$[element].isDeleted": true,
          },
        },
        {
          arrayFilters: [
            { "element._id": Types.ObjectId(id), "element.isDefault": false },
          ],
        }
      )
      .exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return User.aggregate(aggregateOptions, (err, aggregation) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          return res.status(200).send({ Addresses: aggregation[0]?.Addresses });
        });
      });
  });
};

exports.addProductToCart = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (req.query.qty && isNaN(req.query.qty))
    return res.status(500).send({ message: "Invalid quantity" });

  const quantity = req.query.qty ? parseInt(req.query.qty) : 1;

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Product.findOne({ _id: req.params.id, isDeleted: false }).exec(
    (err, product) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!product)
        return res.status(404).send({ message: "Product not found" });

      const productId = Types.ObjectId(req.params.id);

      if (product._doc.stock < quantity) {
        return res
          .status(400)
          .send({ message: "Shop does not have enough stock" });
      }

      return User.findById(req.user.id).exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        const filteredProductCart = user._doc.Cart.filter(
          (v) => v.Product.toHexString() === productId.toHexString()
        );

        if (
          filteredProductCart.length !== 0 &&
          product.stock < filteredProductCart[0].qty + quantity
        )
          return res
            .status(400)
            .send({ message: "Shop does not have enough stock" });

        User.findOneAndUpdate(
          { _id: req.user.id },
          [
            {
              $set: {
                Cart: {
                  $cond: [
                    { $in: [productId, "$Cart.Product"] },
                    {
                      $map: {
                        input: "$Cart",
                        in: {
                          $cond: [
                            { $eq: ["$$this.Product", productId] },
                            {
                              Product: "$$this.Product",
                              qty: { $add: ["$$this.qty", quantity] },
                            },
                            "$$this",
                          ],
                        },
                      },
                    },
                    {
                      $concatArrays: [
                        "$Cart",
                        [{ Product: productId, qty: quantity }],
                      ],
                    },
                  ],
                },
              },
            },
          ],
          {
            new: true,
          }
        ).exec((err, user) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });
          return res.status(200).send({ user });
        });
      });
    }
  );
};

exports.getCartItem = (req, res, next) => {
  User.findOne({ _id: req.user.id })
    .populate("Cart.Product", "-Reviews")
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      return res.status(200).send({ Cart: user._doc.Cart });
    });
};

exports.deleteCartItem = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (req.query.qty && isNaN(req.query.qty))
    return res.status(500).send({ message: "Invalid quantity" });

  const quantity = req.query.qty ? parseInt(req.query.qty) : 1;

  if (!isValidObjectId(req.params.id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  const productId = Types.ObjectId(req.params.id);

  return User.findById(req.user.id).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    const filteredProductCart = user._doc.Cart.filter(
      (v) => v.Product.toHexString() === productId.toHexString()
    );

    if (filteredProductCart.length == 0)
      return res.status(500).send({ message: "Invalid Product Id" });

    if (
      filteredProductCart.length !== 0 &&
      filteredProductCart[0].qty < quantity
    )
      return res.status(400).send({ message: "Invalid Quantity" });

    User.findOneAndUpdate(
      { _id: req.user.id },
      [
        {
          $addFields: {
            Cart: {
              $reduce: {
                input: "$Cart",
                initialValue: [],
                in: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$$this.Product", productId] },
                        { $gt: ["$$this.qty", quantity] },
                      ],
                    },
                    {
                      $concatArrays: [
                        "$$value",
                        [
                          {
                            $mergeObjects: [
                              "$$this",
                              { qty: { $add: ["$$this.qty", -quantity] } },
                            ],
                          },
                        ],
                      ],
                    },
                    {
                      $cond: [
                        { $eq: ["$$this.Product", productId] },
                        "$$value",
                        { $concatArrays: ["$$value", ["$$this"]] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ],
      {
        new: true,
      }
    ).exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });
      return res.status(200).send({ user });
    });
  });
};

exports.orderItem = (req, res, next) => {
  const { ids, billToAddressId, shipToAddressId, paymentType, courier } =
    req.body;
  const validation = userOrderValidator.safeParse({
    ids,
    billToAddressId,
    shipToAddressId,
    paymentType,
    courier,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
    });
  }

  Courier.findById(courier).exec((err, courier) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    if (!courier)
      return res.status(500).send({
        message: "Courier not found",
      });

    return User.findById(req.user.id).exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      const billToAddress = user._doc.Addresses.filter(
        (v) => v._id.toHexString() === billToAddressId
      );
      const shipToAddress = user._doc.Addresses.filter(
        (v) => v._id.toHexString() === shipToAddressId
      );

      if (billToAddress.length === 0 || shipToAddress.length === 0)
        return res.status(500).send({
          message: "Invalid Address Id",
        });

      const cartItems = user._doc.Cart.filter((v1) => {
        return ids.some((v2) => {
          return v1.Product.toHexString() === v2;
        });
      });

      if (cartItems.length !== ids.length)
        return res.status(404).send({ message: "Cart Items not found" });

      const cartItemsId = cartItems.map((v) => v.Product);

      Product.aggregate([
        {
          $match: {
            _id: { $in: cartItemsId },
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: "shops",
            localField: "Shop",
            foreignField: "_id",
            as: "Shop",
          },
        },
        {
          $unset: ["Reviews"],
        },
        { $group: { _id: "$Shop", Products: { $push: "$$ROOT" } } },
        { $unwind: "$_id" },
        {
          $project: {
            _id: 0,
            Shop: {
              $mergeObjects: ["$_id", { Orders: "$Products" }],
            },
            totalProducts: { $size: "$Products" },
          },
        },
        {
          $unset: [
            "Shop.Orders.Shop",
            "Shop.Orders.searchTerms",
            "Shop.Orders.Departments",
          ],
        },
      ]).exec((err, product) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        const groupedByShops = product;

        const aggregateTotalProductsQty = groupedByShops
          .map((item) => item.totalProducts)
          .reduce((prev, next) => prev + next);

        if (!groupedByShops || aggregateTotalProductsQty !== ids.length)
          return res.status(404).send({ message: "Products not found" });

        const invalidQtyProducts = [];
        const productsForUpdate = [];

        groupedByShops.map((v1) => {
          v1.Shop.Orders.map((v2) => {
            const res = cartItems.filter(
              (v3) => v3.Product.toHexString() === v2._id.toHexString()
            );

            v2.thumbnail = "test";
            v2.orderQty = res[0].qty;

            productsForUpdate.push({
              updateOne: {
                filter: { _id: v2._id },
                update: { $inc: { stock: -v2.orderQty } },
              },
            });

            if (v2.orderQty > v2.stock) invalidQtyProducts.push(v2);
          });
        });

        if (invalidQtyProducts.length > 0)
          return res.status(404).send({
            err: "NoStock",
            productId: invalidQtyProducts[0]._id,
            message: `${invalidQtyProducts[0].name} doesn't have enough stock: Stock: ${invalidQtyProducts[0].stock}`,
          });
        0;
        const newOrders = groupedByShops.map((v1) => {
          return new Order({
            Shop: v1.Shop,
            User: {
              ...user._doc,
              Addresses: { billTo: billToAddress[0], shipTo: shipToAddress[0] },
            },
            paymentType,
            Courier: courier,
            Discount: null,
            StatusLog: [{ code: 1, status: "To be payed" }],
          });
        });

        const remainingCartItem = user._doc.Cart.filter((v1) => {
          return !ids.some((v2) => {
            return v1.Product.toHexString() === v2;
          });
        });

        // return res.status(200).send({ newProducts });
        return Order.insertMany(newOrders, (err, orders) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          return Product.bulkWrite(productsForUpdate, (err, newProducts) => {
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            return user
              .updateOne({ Cart: remainingCartItem })
              .exec((err, updatedUser) => {
                if (err)
                  return res.status(500).send({
                    message: "There was an error submitting your request",
                  });

                return res.status(200).send({
                  message: "Successfully ordered your items",
                });
              });
          });
        });
      });
    });
  });
};

exports.cancelOrder = (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  Order.findOne({ _id: id, "User._id": req.user.id, isCancelled: false }).exec(
    (err, order) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (!order)
        return res.status(404).send({
          message: "Order not found",
        });

      if (order.isAccepted)
        return res.status(500).send({
          message: "Order cannot be cancelled",
        });

      order.updateOne({ isCancelled: true }).exec((err, newOrder) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        if (!newOrder)
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

        return Product.bulkWrite(productsForUpdate, (err, newProducts) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          return res
            .status(200)
            .send({ message: "Successfully cancelled order" });
        });
      });
    }
  );
};
