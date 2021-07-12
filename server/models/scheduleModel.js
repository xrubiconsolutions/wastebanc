
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
    scheduleCreator:{
        type: String,
        default: "",
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
    expiryDuration:{
        type : Date,
        default: () => Date.now() + 7*24*60*60*1000
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
    organisation: {
        type: String,
        default: ""
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

    lcd  : {
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
