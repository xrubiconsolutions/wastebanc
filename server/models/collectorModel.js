"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const collector_Schema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  IdNumber: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  countryCode: {
    type: String,
    default: "+234",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  id: {
    type: Number,
  },
  gender: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  organisation :{
      type: String
  }
});

module.exports = MONGOOSE.model("Collector", collector_Schema);
