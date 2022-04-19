"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

/**************************************************
 ************* notification Model or collection ***********
 **************************************************/

// expiry.setDate(expiry.getDate() + 365 );

const notification_Schema = new Schema({
  notification_type: {
    type: String,
    enum: ["schedule_made"],
    required: true,
    default: "schedule_made",
  },
  recycler_id: {
    type: String,
    default: "",
  },
  schedulerId: {
    type: String,
  },
  seenNotification: {
    type: Boolean,
    default: false,
  },
  lcd: {
    type: String,
  },
  title: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  scheduleId: {
    type: String,
    default: "",
  },
  dropOffId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = MONGOOSE.model("notification", notification_Schema);
