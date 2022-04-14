"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/

var expiry = new Date();
expiry.setDate(new Date().getDate() + 365);

const user_Schema = new Schema({
  username: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
    default: "First",
  },
  lastname: {
    type: String,
    required: true,
    default: "Last",
  },
  othernames: {
    type: String,
    required: true,
    default: "Other_names",
  },
  address: {
    type: String,
    required: true,
    default: "Lagos",
  },
  cardID: {
    type: String,
  },
  fullname: {
    type: String,
  },
  email: {
    type: String,
    // required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },

  role: {
    type: String,
    default: "",
  },
  displayRole: {
    type: String,
    default: "",
  },

  roles: {
    type: String,
    enum: ["client", "collector", "admin", "analytics-admin"],
    required: true,
    default: "client",
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
  userType: {
    type: Number,
    default: 1,
  },
  availablePoints: {
    type: Number,
    required: true,
    default: 0,
  },
  rafflePoints: {
    type: Number,
    default: 0,
  },
  schedulePoints: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
  },
  lcd: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  onesignal_id: {
    type: String,
  },
  last_logged_in: {
    type: Date,
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
  expiry_licence: {
    type: Date,
    default: () => Date.now() + 365 * 24 * 60 * 60 * 1000,
  },
  profile_picture: {
    type: String,
  },
  internet_provider: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  countries: {
    type: Array,
  },
  states: {
    type: Array,
  },
  status: {
    type: String,
    default: "active",
  },
  resetToken: {
    type: String,
  },
  resetTimeOut: {
    type: Date,
  },
  uType: {
    type: Number,
  },
  organisationType: {
    type: String,
  },
  locationScope: {
    type: String,
  },
});

user_Schema.pre("save", function (next) {
  if (this.roles === "client") next();
  this.locationScope = "All";
});

module.exports = MONGOOSE.model("User", user_Schema);
