"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const version_Schema = new Schema(
  {
    app_type: {
      type: String,
      enum: [
        "android_user",
        "android_recycler",
        "ios_user",
        "ios_recycler",
        "android_business",
        "ios_business",
      ],
      required: true,
    },
    latest_version: {
      type: String,
      required: true,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("versions", version_Schema);
