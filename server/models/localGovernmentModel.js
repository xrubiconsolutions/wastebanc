"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* localGovernment Model or collection ***********
 **************************************************/

const localGovernment_Schema = new Schema(
  {
    lcd: {
      type: String,
      required: true,
    },
    lga: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    country: {
      type: String,
    },
    state: { type: String },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  { timestamps: true }
);
module.exports = MONGOOSE.model("localGovernment", localGovernment_Schema);
