"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const GeoSchema = new Schema({
  type: {
    type: String,
    default: "Point",
  },
  coordinates: {
    type: [Number],
    index: "2dsphere",
  },
});

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const dropOff_Schema = new Schema(
  {
    organisation: {
      type: String,
      required: true,
    },
    organisationId: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },

    location: {
      type: {
        address: {
          type: String,
          required: true,
        },
        lat: {
          type: Number,
          required: true,
        },
        long: {
          type: Number,
          required: true,
        },
      },
      required: true,
    },
    country: {
      type: String,
      default: "Nigeria",
    },
    state: {
      type: String,
      default: "Lagos",
    },
    lastDroppedDate: {
      type: Date,
    },
    organisationLocation: {
      type: String,
    },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // },

    newLocation: GeoSchema,
    status: {
      type: String,
      default: "active",
    },
    orgID: {
      type: Schema.Types.ObjectId,
      ref: "Organisation",
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("dropOff", dropOff_Schema);
