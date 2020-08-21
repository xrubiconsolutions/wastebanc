
"use strict";
/************* Modules ***********/
const MONGOOSE      =   require("mongoose");
const Schema        =   MONGOOSE.Schema;
const Constants     =   require("../util/constants");

/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const user_Schema = new Schema({
        username: {
            type: String,
            required: true,
        },
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
        type: Number,
        required: true,
        default: 1200
    },
    fullname:{
        type: String,
    },
    email: {
        type: String,
        // required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique:true
    },
    password: {
        type: String,
        "required": true,
    },
    createAt: {
        type: Date,
        default: Date.now
    },

    roles: {
        type: String,
        enum: ["client", "collector", "admin"],
        required: true,
        default: "client"
    },
    countryCode: {
        type: String,
        default: "+234",
    },
    verified: {
        type: Boolean,
        default:false
    },
    id: {
        type: Number,
    },
    userType : {
        type: Number,
        default:5
    },
    availablePoints: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports =  MONGOOSE.model("User", user_Schema);
