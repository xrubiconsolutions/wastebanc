const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const passwordSchema = new Schema({
  user: {
    type: String,
  },
  password: {
    type: String,
  },
});

module.exports = MONGOOSE.model("passwords", passwordSchema);
