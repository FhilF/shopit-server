const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

var ProductReviewSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    review: { type: String, required: true },
    imageUrls: [{ type: String, required: true }],
    rate: { type: Number, required: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductReview", ProductReviewSchema);
