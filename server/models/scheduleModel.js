
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
    phone : {
        type: String
    },
    Category: {
        type: String,
        // enum : ["plastic bottles", "cans", "rubber", "paper materials"],
        required: true,
    },
    quantity:{
            type: Number,
            default: 0,
            required: true
    },
    details: {
        type: String,
        //required: true,
    },
    address:{
        type: String,
        required: true
    },
    pickUpDate: {
        type: Date,
        required: true,
    },
    reminder:{
        type: Boolean,
        required: true,
        default: false
    },
    callOnArrival :{
        type: Boolean,
        default: false,
        required: true
    },
    completionStatus: {
        type: String,
        enum: ["completed", "pending", "missed", "cancelled"],
        default: "pending"
    },
    cancelReason : {
        type: String
    },
    collectorStatus: {
        type: String,
        enum: ["decline", "accept"],
        default: "decline",
    },
    acceptedBy:{
        type: Boolean,
        default: false
    },
    collectedBy: {
        type: String,
    },
    rating:{
        type: Number
    },
    comment: {
        type: String
    },
    organisationCollection:{
        type: String
    },
    lat: {
        type: Number,
        required: true
    },
    long: {
        type: Number,
        required: true
    },
    createdAt : {
        type : Date,
        default: Date.now()
    }
});

module.exports =  MONGOOSE.model("schedulePick", schedulePick);
