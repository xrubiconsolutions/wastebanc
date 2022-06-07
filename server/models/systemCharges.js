"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const systemChargesModel = new Schema({
  name: { type: String },
  chargePercentage: { type: Number },
  minNum: { type: Number },
  maxNum: { type: Number },
});

module.exports = MONGOOSE.model("systemcharges", systemChargesModel);
