"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const transaction_Schema = {
  weight: {
    type: Number,
    required: true,
  },

  coin: {
    type: Number,
    required: true,
  },

  scheduleId: {
      type: String,
      required: true

  },
  cardID: {
    type: String,
    required: true,
  },

  completedBy: {
    type: String,
    required: true,
  },
  Category: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
};

module.exports = MONGOOSE.model("transaction", transaction_Schema);
