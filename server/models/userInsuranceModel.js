const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userInsuranceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    plan_name: {
      type: String,
      required: true,
    },
    payment_plan: {
      required: true,
      type: Number,
    },
    gender: {
      required: true,
      type: String,
    },
    image_url: {
      required: true,
      type: String,
    },
    first_name: {
      required: true,
      type: String,
    },
    last_name: {
      required: true,
      type: String,
    },
    email: {
      required: true,
      type: String,
    },
    dob: {
      required: true,
      type: String,
    },
    phone: {
      required: true,
      type: String,
    },
    product_id: {
      required: true,
      type: String,
    },
    expiration_date: {
      required: true,
      type: Date,
    },
    activation_date: {
      required: true,
      type: Date,
    },
    price: {
      required: true,
      type: Number,
    },
    policy_id: {
      required: true,
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("userInsurance", userInsuranceSchema);
