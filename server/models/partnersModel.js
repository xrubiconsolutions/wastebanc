const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;

const partnersModel = new Schema({
    name:{type: String},
    baseUrl: { type: String},
    keys: {type: Object, default: {}}
});

module.exports = MONGOOSE.model("partners", partnersModel);