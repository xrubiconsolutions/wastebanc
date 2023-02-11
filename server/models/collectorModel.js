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
  roles: {
    type: String,
    default: "collector",
  },
  collectorType: {
    type: String,
    default: "collector",
  },
  busy: {
    type: Boolean,
    default: false,
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
  status: {
    type: String,
    default: "active",
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
  organisation: {
    type: String,
  },
  organisationId: {
    type: String,
  },
  IdNumber: {
    type: String,
  },
  state: {
    type: String,
    default: "Lagos",
  },
  place: {
    type: String,
  },
  companyVerified: {
    type: Boolean,
    default: false,
  },
  aggregatorId: {
    type: String,
  },
  localGovernment: {
    type: String,
  },
  areaOfAccess: {
    type: Array,
  },
  approvedBy: {
    type: String,
    default: null,
  },
  totalCollected: {
    type: Number,
    default: 0,
  },
  pointGained: {
    type: Number,
    default: 0,
  },
  ledgerPoints: {
    type: Array,
    default: [],
  },
  numberOfTripsCompleted: {
    type: Number,
    default: 0,
  },
  lat: {
    type: Number,
  },
  long: {
    type: Number,
  },
  onesignal_id: {
    type: String,
  },
  profile_picture: {
    type: String,
  },
  mobile_carrier: {
    type: String,
  },
  phone_type: {
    type: String,
  },
  phone_OS: {
    type: String,
  },
  last_logged_in: {
    type: Date,
  },
  internet_provider: {
    type: String,
  },
  expiry_licence: {
    type: Date,
    default: () => Date.now() + 365 * 24 * 60 * 60 * 1000,
  },
  country: {
    type: String,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
  account: {
    accountName: { type: String },
    accountNo: { type: String },
    bankName: { type: String },
    bankSortCode: { type: String },
  },
  firstLogin: {
    type: Boolean,
    default: true,
  },
  terms_condition: {
    type: Boolean,
    default: false,
  },
  percentageAcc: {
    type: Number,
  },
  approvalStatus: {
    type: String,
    default: "PENDING",
    enum: ["PENDING", "APPROVED", "DECLINED"],
  },
});

module.exports = MONGOOSE.model("Collector", collector_Schema);
