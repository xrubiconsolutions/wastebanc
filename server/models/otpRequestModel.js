"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const otpRequest = new Schema({});

module.exports = MONGOOSE.model("otpRequest", otpRequest);
