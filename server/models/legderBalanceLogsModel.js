"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const legderBalanceSchema = new Schema(
  {
    userId: { type: String },
    scheduleId: { type: String },
    transactionId:{type:String},
    pointGained: { type: Number },
    userType: { type: String, default: "household" },
    previousBalance: { type: String, default: "0" },
    paidToBalance: { type: Boolean, default: false },
    scheduleType: { type: String },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("legderBalance", legderBalanceSchema);
