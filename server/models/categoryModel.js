"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  value: { type: String },
  wastepicker: { type: Number, default: 0 },
});

module.exports = MONGOOSE.model("categories", categorySchema);
