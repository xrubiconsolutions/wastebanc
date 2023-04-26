"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const insurance_schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    userBalance: {
      type: Number,
      default: 0,
    },
    insuranceObject: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("insuranceLogs", insurance_schema);
