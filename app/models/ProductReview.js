const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var ProductReviewSchema = new Schema(
  {
    UserId: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    comment: { type: String, required: true },
    rate: { type: Number, required: true },
    variationName: { type: String },
    variation: { type: String },
    imageUrls: [{ type: String, required: true }],
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductReview", ProductReviewSchema);
