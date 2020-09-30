
"use strict";
/************* Modules ***********/
const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;
const Constants     =   require("../util/constants");

/**************************************************
 ************* Schedule Model or collection ***********
 **************************************************/
const geolocation = new Schema({
    lat: {
        type: Number,
        default: 6.4654
    },
    long :{
        type: Number,
        default: 3.4064
    }
})

const schedulePick = new Schema({
    client:{
        type:String,
        required: true,
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
    collectedBy: {
        type: String,
    },
    rating:{
        type: Number
    },
    comment: {
        type: String
    },
    organisationCollection:{  //Organisation ID
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
