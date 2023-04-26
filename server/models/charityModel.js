"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const charity_Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    charityOrganisation: {
      type: Schema.Types.ObjectId,
      ref: "CharityOrganisation",
    },
    cardID: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    state: {
      type: String,
      default: "Lagos",
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("charity", charity_Schema);
