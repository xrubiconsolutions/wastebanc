"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const role_schema = new Schema({
  title: { type: String, required: true },
  group: { type: String, required: true },
  claims: {
    claim: [
      {
        claimId: { type: Schema.Types.ObjectId, ref: "claims" },
        permission: {
          create: { type: boolean, default: false },
          edit: { type: boolean, default: false },
          delete: { type: boolean, default: false },
          read: { type: boolean, default: false },
        },
      },
    ],
    default: [],
  },
  active: { type: Boolean, default: true },
});

module.exports = MONGOOSE.model("roles", role_schema);
