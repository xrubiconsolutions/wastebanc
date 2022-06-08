"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const paymentLogs = new Schema(
  {
    userId: { type: String },
    transactionIds: [{ type: Schema.Types.ObjectId, ref:"transaction"}],
    fromAccount: { type: String },
    amount: { type: String },
    referenceCode: { type: String },
    beneficiaryName: { types: String },
    paymentReference: { types: String },
    customerShowName: { types: String },
    status: { type: String },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("paymentLogs", paymentLogs);
