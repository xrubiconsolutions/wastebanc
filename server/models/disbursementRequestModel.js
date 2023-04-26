const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const DisbursementRequestSchema = new Schema(
  {
    userType: {
      type: String,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    collector: {
      type: Schema.Types.ObjectId,
      ref: "Collector",
    },
    otp: {
      type: String,
    },
    currency: {
      type: String,
    },
    amount: {
      type: Number,
    },
    charge: {
      type: Number,
    },
    withdrawalAmount: {
      type: Number,
    },
    type: {
      type: String,
    },
    beneName: {
      type: String,
    },
    destinationAccount: {
      type: String,
    },
    bankName: {
      type: String,
    },
    destinationBankCode: {
      type: String,
    },
    status: {
      type: String,
    },
    reference: {
      type: String,
    },
    transactions: {
      type: Array,
    },
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model(
  "disbursementrequests",
  DisbursementRequestSchema
);
