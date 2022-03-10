"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const activitiesModel = new Schema({
  userType: { type: String, default: "collector" },
  userId: { type: String },
  message: { type: String },
  activity_type: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = MONGOOSE.model("userActivities", activitiesModel);
