"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* localGovernment Model or collection ***********
 **************************************************/


const localGovernment_Schema = new Schema({
  lcd: {
    type: String,
    required: true,
  },
  lga: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = MONGOOSE.model("localGovernment", localGovernment_Schema);
