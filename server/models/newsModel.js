const { Schema, model } = require("mongoose");
const { NEWS_CATEGORY_ENUM } = require("../util/constants");

const NewsSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: NEWS_CATEGORY_ENUM,
    },
    headline: {
      required: true,
      type: String,
      maxLength: 255,
    },
    body: String,
    contentUrl: String,
    imageUrl: String,
    contentDate: Date,
  },
  { timestamps: true }
);

module.exports = model("News", NewsSchema);
