const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const paymentRequests = new Schema(
  {
    userType: { type: String },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    collector: { type: Schema.Types.ObjectId, ref: "Collector" },
    currency: { type: String },
    amount: { type: Number },
    charge: { type: Number },
    withdrawalAmount: { type: Number },
    withdrawalAmountSt: { type: String },
    beneName: { type: String },
    destinationAccount: { type: String },
    bankName: { type: String },
    status: { type: String },
    referenceCode: { type: String },
    transactions: [{ type: Schema.Types.ObjectId, ref: "transaction" }],
    // transactions: [
    //   { _id: { type: Schema.Types.ObjectId, ref: "transaction" } },
    // ],
  },
  { timestamps: true }
);

module.exports = MONGOOSE.model("disbursementrequests", paymentRequests);
