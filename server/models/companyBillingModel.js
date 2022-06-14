"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const companyBillingSchema = new Schema({
  companyId: { type: Schema.Types.ObjectId, ref: "Organisation" },
  invoiceNumber: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  transactionId: [{ type: Schema.Types.ObjectId, ref: "transaction" }],
  amount: { type: String },
  serviceCharge: { type: String },
  paidStatus: { type: String, default: "pending" },
  generatedDate: { type: Date },
  expectedPaymentDate: { type: Date },
  paymentDate: { type: Date },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedDate: { type: Date },
  amountPaid: { type: String },
  balance: { type: String },
});

module.exports = MONGOOSE.model("companyBilling", companyBillingSchema);
