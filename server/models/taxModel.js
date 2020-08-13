
"use strict";
/************* Modules ***********/
const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;
const Constants     =   require("../util/constants");



const taxPay_Schema = {

    firstname :{
        type: String,
        required: true,
        default: "First"
    },
    lastname : {
        type: String,
        required: true,
        default: "Last"
    },
    othernames: {
        type: String,
        required: true,
        default: "Other_names"
    },
    address: {
        type: String,
        required: true,
        default: "Lagos"
    },
    cardID :{
        type: String,
        required: true,
        default: "0x54"
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique:true
    }
    
}

module.exports =  MONGOOSE.model("taxPay", taxPay_Schema);
