"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const transaction_Schema = new Schema(
  {
    weight: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
    },
    address: {
      type: String,
    },
    fullname: {
      type: String,
      required: true,
    },
    coin: {
      type: Number,
      required: true,
    },
    wastePickerCoin: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
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
    },
    categories: {
      type: Array,
    },
    organisationID: {
      type: String,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
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
    organisationID: {
      type: String,
    },
    state: {
      type: String,
    },
    ref_id: {
      type: String,
    },
    organisationPaid: {
      type: Boolean,
      default: false,
    },
    requestedEvacuation: {
      type: Boolean,
      default: false,
    },
    isEvacuated: {
      type: Boolean,
      default: false,
    },
    percentage: {
      type: Number,
    },
    amountTobePaid: {
      type: Number,
    },
    wastePickerPercentage: {
      type: Number,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
    },
    approval: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("transaction", transaction_Schema);
