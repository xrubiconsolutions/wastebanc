"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const claims_schema = new Schema({
  title: { type: String, required: true },
  icon: { type: String, default: "" },
  path: { type: String, required: true },
  ancestor: [{ type: Schema.Types.ObjectId, ref: "claims" }],
  children: [{ type: Schema.Types.ObjectId, ref: "claims" }],
  iconClosed: { type: String, required: "" },
  iconOpened: { type: String, required: "" },
  show: { type: Boolean, default: true },
  position: { type: Number, required: true },
});

module.exports = MONGOOSE.model("claims", claims_schema);
