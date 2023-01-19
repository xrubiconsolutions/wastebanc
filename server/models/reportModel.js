"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Report Model or collection ***********
 **************************************************/
const report_Schema = new Schema(
  {
    apiKey: {
      type: String,
      required: true,
    },
    sessionID: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    userReportID: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    lat: {
      type: String,
    },
    long: {
      type: String,
    },
    // createdAt: {
    //     type: Date,
    //     default: Date.now
    // },
    addressArea: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("report", report_Schema);
