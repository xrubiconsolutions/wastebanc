"use strict";
/************* Modules ***********/
const MONGOOSE = require("mongoose");
const Schema = MONGOOSE.Schema;
const Constants = require("../util/constants");

const companyReceipt_Schema = {
    amount:{
        type: Number,
        required: true
    },
    currency :{
        type:String,
        required: true
    },
    customerName:{
        type: String,
        required: true
    },
    customerMail: {
        type: String
    },
    customerPhone: {
        type: String
    },
    flw_ref:{
        type: String,
        required: true
    },
    status: {
        type: String
    },
    tx_ref: {
        type: String,
        required: true
    },
    transaction_id :{
        type: String,
        
    }  
};

module.exports = MONGOOSE.model("companyReceipt", companyReceipt_Schema);
