"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const organisationType = new Schema({
  name: { type: String },
  createdAt: { type: String },
  default: { type: Boolean },
});

module.exports = MONGOOSE.model("organisationType", organisationType);
