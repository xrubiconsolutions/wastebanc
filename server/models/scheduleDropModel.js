"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Schedule Model or collection ***********
 **************************************************/

const scheduleDrop = new Schema({
  scheduleCreator: {
    type: String,
    default: "",
  },
  clientId: {
    type: String,
    default: "",
  },
  fullname: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
  },
  organisationPhone: {
    type: String,
  },
  Category: {
    type: String,
    // enum : ["plastic bottles", "cans", "rubber", "paper materials"],
    //required: true,
  },
  categories: { type: Array },
  quantity: {
    type: Number,
    default: 0,
    required: true,
  },
  details: {
    type: String,
    //required: true,
  },
  address: {
    type: String,
    required: true,
  },
  expiryDuration: {
    type: Date,
    //default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
  completionStatus: {
    type: String,
    enum: ["completed", "pending", "missed", "cancelled"],
    default: "pending",
  },
  organisation: {
    type: String,
    default: "",
  },
  collectedBy: {
    type: String,
  },
  organisationCollection: {
    type: String,
  },

  lcd: {
    type: String,
  },
  cancelReason: {
    type: String,
  },
  dropOffDate: {
    type: Date,
    required: true,
  },
  state: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = MONGOOSE.model("scheduleDrop", scheduleDrop);
