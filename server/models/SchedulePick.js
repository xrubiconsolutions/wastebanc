
"use strict";
/************* Modules ***********/
const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;
const Constants     =   require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const schedulePick_Schema = new Schema({
    quantity: {
        type: [String],
        enum : ["plastic bottles", "cans", "rubber", "paper materials"],
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    address:{
        type: String,
        required: true
    },
    pickUpDate: {
        type: Date,
        default: Date.now
    },
    reminder:{
        type: Date,
        default: Date.now
    },
    callOnArrival :{
        type: Boolean,
        default: false,
        required: true
    },
    completionStatus: {
        type: [String],
        enum: ["completed", "pending", "missed"]
    },
    status: {
        type: Number,
        default: 0
    }
});

module.exports =  MONGOOSE.model("schedulePick", schedulePick_Schema);
