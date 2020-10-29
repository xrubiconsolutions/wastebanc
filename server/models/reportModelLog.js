"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Report Model or collection ***********
 **************************************************/
const reportLog_Schema = new Schema({
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
  name: {
    type: String
  },
  email:{
    type: String
  },
  phone: {
    type: String
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
  },
  addressArea:{
    type: String
  },
  address:{
      type:String
  }
});

module.exports = MONGOOSE.model("reportLog", reportLog_Schema);
