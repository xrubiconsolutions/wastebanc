"use strict";

const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const transactionActivites = new Schema(
  {
    userId: { type: String },
    userType:{type:String}, // household, wastepicker
    // transaction:{type:Schema.Types.ObjectId, ref:'transactions'},
    // disbursument:{type:Schema.Types.ObjectId, ref:"disbursementrequests"},
    // scheduleType: {type: String},
    transactionType: { type: String }, // debit or credit
    message: { type: String },
    amount: { type: String },
    status: { type: String },
    type: { type: String }, // payment_bank,payment_insurance,payment_charity,schedule_pickup,schedule_dropOff
    transaction: { type: String },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("transactionactivites", transactionActivites);
