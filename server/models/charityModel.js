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
    },
    charity: {
      type: Schema.Types.ObjectId,
      ref: "CharityOrganisation",
    },
    userId: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    organisation: {
      type: String,
      required: true,
    },
    organisationID: {
      type: String,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    aggregatorName: {
      type: String,
      required: true,
    },
    aggregatorId: {
      type: String,
      required: true,
    },
    aggregatorOrganisation: {
      type: String,
      required: true,
    },
    scheduleId: {
      type: String,
      required: true,
    },
    quantityOfWaste: {
      type: Number,
      //required: true,
    },
    cardID: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
    state: {
      type: String,
      default: "Lagos",
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("charity", charity_Schema);
