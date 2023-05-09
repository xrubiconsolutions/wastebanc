const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { EVACUATION_STATUSES_ENUM } = require("../util/constants");

const evacuationSchema = new Schema(
  {
    transactions: {
      type: [mongoose.Types.ObjectId],
      required: true,
      ref: "transaction",
    },
    collector: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Collector",
    },
    organisation: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Organisation",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    totalWeight: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: EVACUATION_STATUSES_ENUM[0],
      enum: EVACUATION_STATUSES_ENUM,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Evacuation", evacuationSchema);
