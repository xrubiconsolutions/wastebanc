"use strict";

/**************************************************
 ***** LIVE REPORTING controller for REPORT logic ****
 **************************************************/

let realtimeController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");
const Socketio = require("socket.io");










realtimeController.report = (req, res) => {

    const locations = [];

    Socketio.on("connection", socket=>{
                for(let i = 0 ; i < locations.length; i ++){
                    socket.emit("location", locations[i]);
                }
                socket.on("location", data=>{
                    locations.push(data);
                    Socketio.emit("location", data)
                })
    })


  
};


/* export realtimeControllers */
module.exports = realtimeController;
