const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { VERIFICATION_TYPES } = require("../util/constants");

const RecentVerificationSchema = new Schema(
  {
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    verificationType: {
      type: String,
      enum: VERIFICATION_TYPES,
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiryTime: {
      type: Number,
    },
    status: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "NOT_VERIFIED"],
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* Set expiry time to be 5mins after verification doc creation **/
RecentVerificationSchema.pre("save", function (next) {
  if (this.expiryTime) next();
  const FIVE_MIN_LATER = Date.now() + 1000 * 60 * 5;
  this.expiryTime = FIVE_MIN_LATER;
  next();
});

module.exports = mongoose.model(
  "recent_verification",
  RecentVerificationSchema
);
