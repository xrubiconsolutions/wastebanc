"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Organisation Model or collection ***********
 **************************************************/
const organisation_Schema = new Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  rcNo: {
    type: String,
    required: true,
  },
  companyTag: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  createAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = MONGOOSE.model("Organisation", organisation_Schema);
