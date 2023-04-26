const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const resourceModel = new Schema(
  {
    title: { type: String },
    thumbnail: { type: String },
    message: { type: String },
    url: { type: String },
    show: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now() },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("resources", resourceModel);
