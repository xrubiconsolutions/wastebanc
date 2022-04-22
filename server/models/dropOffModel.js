"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const dropOff_Schema = new Schema({
  organisation: {
    type: String,
    required: true,
  },
  organisationId: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    type: {
      address: {
        type: String,
        required: true,
      },
      lat: {
        type: String,
        required: true,
      },
      long: {
        type: String,
        required: true,
      },
    },
    required: true,
  },
  country: {
    type: String,
    default: "Nigeria",
  },
  state: {
    type: String,
    default: "Lagos",
  },
  lastDroppedDate: {
    type: Date,
  },
  organisationLocation: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MONGOOSE.model("dropOff", dropOff_Schema);
