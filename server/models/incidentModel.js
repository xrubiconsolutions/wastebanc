"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const ObjectId = MONGOOSE.ObjectId;
/**************************************************
 ************* Incident Model or collection ***********
 **************************************************/

const incident_Schema = new Schema(
  {
    description: {
      type: String,
      required: true,
    },
    estimation: {
      type: String,
      required: false,
    },
    commitantGender: {
      type: String,
      enum: ["MALE", "FEMALE", "PREFER_NOT_TO_SAY"],
      default: "PREFER_NOT_TO_SAY",
    },
    organizationsId: {
      type: [ObjectId],
      required: true,
    },
    localArea: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    lat: {
      type: String,
    },
    long: {
      type: String,
    },
    caller: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
    },
    dispatched: {
      type: Boolean,
      default: false,
      required: true,
    },
    responder: {
      type: ObjectId,
    },
    completedDescription: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["RESPONDED", "PENDING", "ASSIGNED"],
      default: "PENDING",
    },
    mediaUrls: [String],
    responder: {
      type: ObjectId,
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("lasepa_incidents", incident_Schema);
