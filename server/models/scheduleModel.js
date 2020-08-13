
"use strict";
/************* Modules ***********/
const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;
const Constants     =   require("../util/constants");

/**************************************************
 ************* Schedule Model or collection ***********
 **************************************************/
const schedulePick = new Schema({
    client:{
        type:String,
        required: true,
    },
    Category: {
        type: String,
        enum : ["plastic bottles", "cans", "rubber", "paper materials"],
        required: true,
    },
    weight:{
            type: Number,
            required: true,
            default: 0
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
        required: true,
        default: Date.now
    },
    reminder:{
        type: Date,
        required: true,
        default: Date.now
    },
    callOnArrival :{
        type: Boolean,
        default: false,
        required: true
    },
    completionStatus: {
        type: String,
        enum: ["completed", "pending", "missed"],
        default: "pending"
    },
    collectorStatus: {
        type: String,
        enum: ["decline", "accept"],
        default: "accept",
        required: true,
    }
});

module.exports =  MONGOOSE.model("schedulePick", schedulePick);
