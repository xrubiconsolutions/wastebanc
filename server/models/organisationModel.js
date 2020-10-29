"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Organisation Model or collection ***********
 **************************************************/

var expiry = new Date()
expiry.setDate(new Date().getDate() + 365 );

const organisation_Schema = new Schema({
  companyName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true
  },
  rcNo: {
    type: String,
    required: true,
  },
  companyTag: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
    unique: true
  },
  role : {
    type: String,
    default : "company"
  },
  licence_active: { // Licence field
    type: Boolean,
    default:false,
  },
  expiry_date :{
      type: Date,
      default: expiry
  },
  totalAvailable :{
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  areaOfAccess:{
    type: [String],
    required: true
  },
  canEquivalent:{
    type: Number
  },
  cartonEquivalent : {
    type : Number
  },
  petBottleEquivalent :{
    type: Number
  },
  rubberEquivalent:{
    type: Number
  },
  plasticEquivalent:{
    type: Number
  },
  createAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = MONGOOSE.model("Organisation", organisation_Schema);
