"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const systemChargesModel = new Schema({
  name: { type: String },
  chargeAmount: { type: Number },
  chargePercentage: { type: Number },
  acNumber: { type: String },
});

module.exports = MONGOOSE.model("systemcharges", systemChargesModel);
