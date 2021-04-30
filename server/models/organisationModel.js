"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* Organisation Model or collection ***********
 **************************************************/

var expiry = Date.now
// expiry.setDate(expiry.getDate() + 365 );

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
    default:true,
  },
  expiry_date :{
      type: Date,
      default: () => Date.now() + 365*24*60*60*1000
    },
  totalAvailable :{
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  resetToken:{
    type: Number,
    default: null
  },
  location: {
    type: String,
    required: true
  },
  areaOfAccess:{
    type: [String],
    required: true
  },
  streetOfAccess: {
    type: [String],
    default: ""
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
  woodEquivalent:{
    type: Number
  },
  glassEquivalent:{
    type: Number
  },
  nylonEquivalent:{
    type: Number
  },
  metalEquivalent:{
    type: Number
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  wallet : {
    type: Number,
    default: 0
  }
});
module.exports = MONGOOSE.model("Organisation", organisation_Schema);
