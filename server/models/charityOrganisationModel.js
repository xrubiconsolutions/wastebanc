const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CharityOrganisationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    bank: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
      maxLength: 5,
      maxLength: 17,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "charityOrganisation",
  CharityOrganisationSchema
);
