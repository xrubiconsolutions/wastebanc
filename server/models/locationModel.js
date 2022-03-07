"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const locationSchema = new Schema({
  country: { type: String, required: true },
  states: { type: Array, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = MONGOOSE.model("locations", locationSchema);
