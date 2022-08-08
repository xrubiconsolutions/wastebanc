const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrganisationLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    data: Schema.Types.Mixed,
    organisation: Schema.Types.ObjectId,
    actionBy: Schema.Types.ObjectId,
  },
  { timestamps: true }
);

module.exports = mongoose.model("organisationLog", OrganisationLogSchema);
