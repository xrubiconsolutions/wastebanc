"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const collector_Schema = new Schema({
  fullname: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  roles:{
    type: String,
    default: "collector"
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  countryCode: {
    type: String,
    default: "+234",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  id: {
    type: Number,
  },
  gender: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  organisation :{
      type: String
  },
  IdNumber: {
    type: String,
  },
  state: {
    type: String
  },
  place:{
    type: String
  },
  aggregatorId: {
    type: String,
  },
  localGovernment: {
    type:String
  },
  areaOfAccess: {
    type : Array
  },
  approvedBy: {
    type: String,
    default: null
 },
  lat : {
    type: String
  },
  long : {
    type :String
  },
  profile_picture:{
    type: String
  },
  mobile_carrier:{
    type:String
  },
  phone_type:{
    type:String
  },
  phone_OS:{
    type: String
  },
  last_logged_in:{
    type: Date
  },
  internet_provider:{
    type: String
  },
   expiry_licence:{
    type: Date,
    default: () => Date.now() + 365*24*60*60*1000
  },
});

module.exports = MONGOOSE.model("Collector", collector_Schema);
