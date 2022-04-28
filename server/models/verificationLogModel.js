const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { VERIFICATION_TYPES } = require("../util/constants");

const VerificationSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      required: true,
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
  },
  { timestamps: true }
);

/* Set expiry time to be 5mins after verification doc creation **/
// VerificationSchema.pre("save", function (next) {
//   if (this.expiryTime) next();
//   const FIVE_MIN_LATER = Date.now() + 1000 * 60 * 5;
//   this.expiryTime = FIVE_MIN_LATER;
//   next();
// });

module.exports = mongoose.model("verification", VerificationSchema);
