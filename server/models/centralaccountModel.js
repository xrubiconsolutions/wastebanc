"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const centralAccountModel = new Schema({
  name: { type: String },
  acnumber: { type: String },
  balance: { type: String },
  nipcharge: { type: Number },
  charge: { type: Number },
});

module.exports = MONGOOSE.model("centralaccounts", centralAccountModel);
