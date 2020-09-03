"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Report Model or collection ***********
 **************************************************/
const report_Schema = new Schema({
  apiKey: {
    type: String,
    required: true,
  },
  sessionID: {
      type: String,
      required: true,
      unique: true
  },
  token: {
      type: String,
      required: true,
      unique: true
  },
  userReportID: {
      type: String,
      required: true,
      unique: true
  },
  active:{
    type: Boolean,
    required: true,
    default: true
  },
  lat: {
        type: String
  },
  long: {
        type: String
  },
  createdAt: {
      type: Date,
      default: Date.now
  }
});

module.exports = MONGOOSE.model("report", report_Schema);
