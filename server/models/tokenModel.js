"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const tokenModel = new Schema({
  userId: { type: String },
  token: { type: String },
  expiryTime: { type: Date },
});

module.exports = MONGOOSE.model("token", tokenModel);
