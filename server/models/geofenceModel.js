"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const TrustedComms = require("twilio/lib/rest/preview/TrustedComms");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

/**************************************************
 ************* geofence Model or collection ***********
 **************************************************/

// expiry.setDate(expiry.getDate() + 365 );

const geofence_Schema = new Schema(
  {
    organisationId: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  { timestamps: true }
);
module.exports = MONGOOSE.model("geofence", geofence_Schema);
