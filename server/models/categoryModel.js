"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const categorySchema = new Schema({
  name: { type: String, required: true },
  value: { type: String },
});

module.exports = MONGOOSE.model('categories', categorySchema);
