"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const invoiceSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: "Organisation" },
    organisationName: { type: String },
    invoiceNumber: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    transactions: [{ type: Schema.Types.ObjectId, ref: "transaction" }],
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
    event: { type: String, default: "generated" },
    state: { type: Array, defaule: [] },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("invoice", invoiceSchema);
