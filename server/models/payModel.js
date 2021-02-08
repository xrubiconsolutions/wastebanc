"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const pay_Schema = {
  userId: {
      type: String,
      required: true
  },
  fullname: {
      type: String,
      required:true
  },
  bankAcNo: {
      type: String,
      required:true
  },
  bankName: {
      type: String,
      required: true
  },
  organisation: {
    type: String,
    required: true
  },
  paid: {
      type: Boolean,
      default: false
  },
  cardID: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

module.exports = MONGOOSE.model("pay", pay_Schema);
