/**
 * Created by lakshmi on 14/02/18.
 */

/**
 * Created by Radhey Shyam on 14/02/18.
 */

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
    fullname:{
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
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
        required: true
    },
    countryCode: {
        type: String,
        default: "+234",
        required: true,
    },
    verified: {
        type: Boolean,
        default:false
    }
});

module.exports =  MONGOOSE.model("User", user_Schema);
