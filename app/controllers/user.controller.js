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
const { cartList } = require("../scripts/modelDataReturn/product");

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

    [("Roles", "Shop", "createdAt", "updatedAt", "__v", "password")].forEach(
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

      if (
        product._doc.isMultipleVariation &&
        !isValidObjectId(req.query.variation_id)
      ) {
        return res.status(404).send({
          message: "Invalid Id",
        });
      }

      const productId = Types.ObjectId(req.params.id);
      const variationId = req.query.variation_id
        ? Types.ObjectId(req.query.variation_id)
        : null;

      if (product._doc.stock < quantity) {
        return res
          .status(400)
          .send({ message: "Shop does not have enough stock" });
      }

      const filteredVariation = product._doc.variations.filter(
        (v) => v._id.toHexString() === variationId.toHexString()
      );

      if (
        (product._doc.isMultipleVariation && !variationId) ||
        (product._doc.isMultipleVariation && filteredVariation.length === 0)
      ) {
        return res.status(400).send({
          message: "Invalid Parameter",
        });
      }

      return User.findById(req.user.id).exec((err, user) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        let productStock = product._doc.isMultipleVariation
          ? filteredVariation[0].stock
          : product._doc.stock;

        const filteredProductCart = product._doc.isMultipleVariation
          ? user._doc.Cart.filter(
              (v) =>
                v._doc.Product.toHexString() === productId.toHexString() &&
                v._doc.variationId.toHexString() === variationId.toHexString()
            )
          : user._doc.Cart.filter(
              (v) => v._doc.Product.toHexString() === productId.toHexString()
            );

        if (
          filteredProductCart.length !== 0 &&
          productStock < filteredProductCart[0].qty + quantity
        )
          return res
            .status(409)
            .send({ message: "Shop does not have enough stock" });

        User.findOneAndUpdate(
          { _id: req.user.id },
          [
            {
              $set: {
                Cart: {
                  $cond: [
                    {
                      $and: [
                        { $in: [productId, "$Cart.Product"] },
                        { $in: [variationId, "$Cart.variationId"] },
                      ],
                    },
                    {
                      $map: {
                        input: "$Cart",
                        in: {
                          $cond: [
                            {
                              $and: [
                                { $eq: ["$$this.Product", productId] },
                                { $eq: ["$$this.variationId", variationId] },
                              ],
                            },
                            {
                              Product: "$$this.Product",
                              qty: { $add: ["$$this.qty", quantity] },
                              variationId: "$$this.variationId",
                              createdAt: "$$this.createdAt",
                              updatedAt: new Date(),
                            },
                            "$$this",
                          ],
                        },
                      },
                    },
                    {
                      $concatArrays: [
                        "$Cart",
                        [
                          {
                            Product: productId,
                            qty: quantity,
                            variationId: variationId,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                          },
                        ],
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

          return res.status(200).send({ Cart: user._doc.Cart });
        });
      });
    }
  );
};

exports.updateCartItemQty = (req, res, next) => {
  const itemId = req.params.id;
  const qty = req.query.qty;
  const variationId = req.query.variation_id ? req.query.variation_id : null;

  if (!itemId) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (!qty || isNaN(qty) || qty === 0)
    return res.status(400).send({ message: "Invalid quantity" });

  if (
    !isValidObjectId(itemId) ||
    (variationId && !isValidObjectId(variationId))
  ) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  User.findOne({ _id: req.user.id })
    .populate({
      path: "Cart",
      populate: {
        path: "Product",
        model: "Product",
        populate: {
          path: "Shop",
          model: "Shop",
        },
      },
    })
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      const cartItems = user._doc.Cart;
      let filteredItem = variationId
        ? cartItems.filter(
            (v) =>
              v._doc.Product._doc._id.toHexString() === itemId &&
              v._doc.Product._doc.isDeleted === false &&
              v._doc.Product._doc.delist === false &&
              v._doc.variationId.toHexString() === variationId
          )
        : cartItems.filter(
            (v) =>
              v._doc.Product._doc._id.toHexString() === itemId &&
              v._doc.Product._doc.isDeleted === false &&
              v._doc.Product._doc.delist === false &&
              v._doc.variationId === null
          );

      if (filteredItem.length === 0) {
        return res.status(500).send({ message: "Item not found" });
      }

      filteredItem = filteredItem[0];

      if (filteredItem.Product.isMultipleVariation) {
        const variant = filteredItem.Product.variations.filter(
          (v) => v._id.toHexString() === variationId
        )[0];
        if (variant.stock < qty) {
          return res
            .status(400)
            .send({ message: "Shop doesn't have enough quantity" });
        }
      } else {
        if (filteredItem.Product.stock < qty) {
          return res
            .status(400)
            .send({ message: "Shop doesn't have enough quantity" });
        }
      }
      user
        .updateOne(
          {
            $set: {
              "Cart.$[elem].qty": qty,
            },
          },
          {
            arrayFilters: [
              {
                "elem.Product": Types.ObjectId(itemId),
                "elem.variationId": variationId
                  ? Types.ObjectId(variationId)
                  : null,
              },
            ],
          }
        )
        .exec((err, newUser) => {
          if (err)
            return res.status(500).send({
              message: "There was an error submitting your request",
            });

          return res.status(200).send({ message: "Success" });
        });
    });
};

exports.getCartItems = (req, res, next) => {
  User.findOne({ _id: req.user.id })
    .populate({
      path: "Cart",
      populate: {
        path: "Product",
        model: "Product",
        populate: {
          path: "Shop",
          model: "Shop",
        },
      },
    })
    .exec((err, user) => {
      if (err)
        return res.status(500).send({
          message: "There was an error submitting your request",
        });

      if (user._doc.Cart.length === 0) {
        return res.status(200).send({
          Cart: [],
        });
      }

      const newCart = user._doc.Cart.map((v) => {
        return {
          _id: v._doc.Product._id,
          name: v._doc.Product.name,
          qty: v._doc.qty,
          stock: v._doc.Product.isMultipleVariation
            ? v._doc.Product.variations.filter(
                (v1) =>
                  v1._id.toHexString() === v._doc.variationId.toHexString()
              )[0].stock
            : v._doc.Product.stock,
          variationId: v._doc.variationId,
          Shop: {
            _id: v._doc.Product.Shop._doc._id,
            name: v._doc.Product.Shop._doc.name,
          },
          variationName: v._doc.Product.isMultipleVariation
            ? v._doc.Product.variationName
            : null,
          variation: v._doc.Product.isMultipleVariation
            ? v._doc.Product.variations.filter(
                (v1) =>
                  v1._id.toHexString() === v._doc.variationId.toHexString()
              )[0].name
            : null,
          unitPrice: v._doc.Product.isMultipleVariation
            ? v._doc.Product.variations.filter(
                (v1) =>
                  v1._id.toHexString() === v._doc.variationId.toHexString()
              )[0].price
            : v._doc.Product.price,
          thumbnail: v._doc.Product.isMultipleVariation
            ? v._doc.Product.variations.filter(
                (v1) =>
                  v1._id.toHexString() === v._doc.variationId.toHexString()
              )[0].fileUrl
            : v._doc.Product.images.filter((v1) => v1.isThumbnail)[0].fileUrl,
        };
      });

      const groupItems = _(newCart)
        .groupBy((x) => x.Shop._id)
        .map((value, key) => ({
          _id: key,
          name: value[0].Shop.name,
          items: value,
        }))
        .value();

      return res.status(200).send({ Cart: groupItems });
    });
};

exports.deleteCartItem = (req, res, next) => {
  const itemId = req.params.id;
  const variationId = req.query.variation_id ? req.query.variation_id : null;
  console.log("aa")

  if (!itemId) {
    return res.status(400).send({
      message: "Invalid Parameter",
    });
  }

  if (
    !isValidObjectId(itemId) ||
    (variationId && !isValidObjectId(variationId))
  ) {
    return res.status(404).send({
      message: "Invalid Id",
    });
  }

  User.findOne({ _id: req.user.id }).exec((err, user) => {
    if (err)
      return res.status(500).send({
        message: "There was an error submitting your request",
      });

    const cartItems = user._doc.Cart;
    let filteredItem = variationId
      ? cartItems.filter(
          (v) =>
            v._doc.Product.toHexString() === itemId &&
            v._doc.variationId.toHexString() === variationId
        )
      : cartItems.filter(
          (v) =>
            v._doc.Product.toHexString() === itemId &&
            v._doc.variationId === null
        );

    if (filteredItem.length === 0) {
      return res.status(500).send({ message: "Item not found" });
    }

    filteredItem = filteredItem[0];

    user
      .updateOne({
        $pull: { Cart: filteredItem },
      })
      .exec((err) => {
        if (err)
          return res.status(500).send({
            message: "There was an error submitting your request",
          });

        return res.status(200).send({ message: "success" });
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

      const cartItemsId = cartItems.map((v) => v._doc.Product);

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
