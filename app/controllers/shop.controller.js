const { isValidObjectId } = require("mongoose");
const {
    shopAddValidator,
    shopUpdateValidator,
  } = require("../scripts/schemaValidators/shop"),
  db = require("../models");

const User = db.user,
  Shop = db.shop;

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
