"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const companyReceipt_Schema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      // licence for licence fee
      type: String,
      default: "business_schedule",
    },
    currency: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMail: {
      type: String,
    },
    customerPhone: {
      type: String,
    },
    flw_ref: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    tx_ref: {
      type: String,
      required: true,
    },
    transaction_id: {
      type: String,
    },
    // createdAt:{
    //     type: Date,
    //     default: Date.now()
    // }
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("companyReceipt", companyReceipt_Schema);
