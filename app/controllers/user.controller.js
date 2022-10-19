const { isValidObjectId, Types } = require("mongoose"),
  _ = require("lodash");
const Product = require("../models/Product");

const { userAddressValidator } = require("../scripts/schemaValidators/user"),
  db = require("../models");

const User = db.user,
  Address = db.address;

exports.getUser = async (req, res, next) => {
  return res.status(200).send({
    message: "There was an error submitting your request",
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
  const {
    fullname,
    phoneNumber,
    country,
    state,
    city,
    zipCode,
    addressLine1,
    addressLine2,
    label,
    isDefault,
  } = address;

  const validation = userAddressValidator.safeParse({
    fullname,
    phoneNumber,
    country,
    state,
    city,
    zipCode,
    addressLine1,
    addressLine2,
    label,
    isDefault,
  });

  if (!validation.success) {
    return res.status(400).send({
      message: `${validation.error.issues[0].path[0]}: ${validation.error.issues[0].message}`,
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

      const newAddress = new Address({
        fullname,
        phoneNumber,
        country,
        state,
        city,
        zipCode,
        addressLine1,
        addressLine2,
        label,
        isDefault,
      });

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
              // console.log(user._doc);
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
        // console.log(user._doc);
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

      // return res.status(200).send({ aggregation });
    }
  );
};

exports.updateDefaultAddress = (req, res, next) => {
  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(500).send({
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
            console.log(err);
            if (err)
              return res.status(500).send({
                message: "There was an error submitting your request",
              });

            return User.aggregate(aggregateOptions, (err, aggregation) => {
              if (err)
                return res.status(500).send({
                  message: "There was an error submitting your request",
                });
              return res
                .status(200)
                .send({ Addresses: aggregation[0]?.Addresses });
            });
          });
      });
  });
};

exports.deleteAddress = (req, res, next) => {
  const { id } = req.query;
  if (!isValidObjectId(id)) {
    return res.status(500).send({
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
        console.log(err);
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

  if (!isValidObjectId(req.params.id)) {
    return res.status(500).send({
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
                            qty: { $add: ["$$this.qty", 1] },
                          },
                          "$$this",
                        ],
                      },
                    },
                  },
                  {
                    $concatArrays: [
                      "$Cart",
                      [{ Product: productId, qty: 1 }],
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

      return res.status(200).send({ user });
    });
};
