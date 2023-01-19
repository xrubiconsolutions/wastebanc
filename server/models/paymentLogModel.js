"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const paymentLog_Schema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },

    companyName: {
      type: String,
      required: true,
    },

    companyId: {
      type: String,
      required: true,
    },

    receiptId: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    modeOfPayment: {
      type: String,
      required: true,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("paymentLog", paymentLog_Schema);
