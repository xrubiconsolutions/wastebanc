const { Schema, model } = require("mongoose");
const { WORK_TYPE_ENUM } = require("../util/constants");

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const careerAdSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    workType: {
      type: String,
      required: true,
      enum: WORK_TYPE_ENUM,
    },
    expirationDate: {
      type: Date,
      min: tomorrow,
      required: true,
    },
    mission: {
      type: [String],
    },
    responsibilities: {
      type: [String],
      required: true,
    },
    requirements: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("careerAd", careerAdSchema);
