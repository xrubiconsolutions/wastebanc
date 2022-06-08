"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const pay_Schema = {
  userId: {
    type: String,
    required: true,
  },
  transactionId: [{ type: Schema.Types.ObjectId, ref: "transaction" }],
  fullname: {
    type: String,
    required: true,
  },
  userPhone: {
    type: String,
    required: true,
  },
  bankAcNo: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  organisation: {
    type: String,
    required: true,
  },
  organisationID: {
    type: String,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  aggregatorName: {
    type: String,
    required: true,
  },
  aggregatorId: {
    type: String,
    required: true,
  },
  aggregatorOrganisation: {
    type: String,
    required: true,
  },
  scheduleId: {
    type: String,
    required: true,
  },
  quantityOfWaste: {
    type: Number,
    required: true,
  },
  cardID: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  state: {
    type: String,
    default: "Lagos",
  },
  referenceCode: { type: String },
  paymentReference: { types: String },
  customerShowName: { types: String },
  status: { type: String },
  reason: { type: String },
  requestId: { type: String },
};

module.exports = MONGOOSE.model("pay", pay_Schema);
