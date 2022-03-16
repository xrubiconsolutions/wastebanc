"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const transaction_Schema = {
  weight: {
    type: Number,
    required: true,
  },

  fullname: {
    type: String,
    required: true,
  },
  coin: {
    type: Number,
    required: true,
  },

  scheduleId: {
    type: String,
    required: true,
  },
  cardID: {
    type: String,
    required: true,
  },

  completedBy: {
    type: String,
    required: true,
  },
  paid: {
    type: Boolean,
    default: false,
  },
  requestedForPayment: {
    type: Boolean,
    default: false,
  },
  Category: {
    type: String,
    required: true,
  },
  categories: {
    type: Array,
  },
  organisationID: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  recycler: {
    type: String,
    required: true,
  },
  paymentResolution: {
    type: String,
    enum: ["charity", "gain"],
    default: "gain",
  },
  aggregatorId: {
    type: String,
    default: "",
  },
  organisation: {
    type: String,
  },
};

module.exports = MONGOOSE.model("transaction", transaction_Schema);
