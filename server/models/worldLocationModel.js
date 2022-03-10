"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const worldlocationsModel = new Schema({
  code2: { type: String },
  code3: { type: String },
  name: { type: String },
  region: { type: String },
  capital: { type: String },
  states: { type: Array },
});

module.exports = MONGOOSE.model("world_locations", worldlocationsModel);
