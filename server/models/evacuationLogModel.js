const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Types;
const { EVACUATION_STATUSES_ENUM } = require("../util/constants");
const ACTION_ENUM = ["ACCEPT", "APPROVE", "REJECT"];

const evacuationLogSchema = new Schema(
  {
    evacuation: {
      type: ObjectId,
      required: true,
    },
    user: {
      type: ObjectId,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ACTION_ENUM,
    },
    prevState: {
      type: String,
      required: true,
      enum: EVACUATION_STATUSES_ENUM,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EvacuationLog", evacuationLogSchema);
