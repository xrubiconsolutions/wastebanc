"use strict"; 

let scheduleController      = {};
let MODEL               = require("../models");
let COMMON_FUN          = require("../util/commonFunction");
let CONSTANTS           = require("../util/constants");




scheduleController.schedule = (REQUEST, RESPONSE)=>{
    var data = { ...REQUEST.body };

    MODEL.scheduleModel(data).save({},(ERR, RESULT) => {
        if(ERR) {
            RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        }
        else {
                let UserData = {
                  client: RESULT.client,
                  quantity: RESULT.quantity,
                  details: RESULT.details,
                  address: RESULT.address,
                  pickUpDate: RESULT.pickUpDate,
                  reminder: RESULT.reminder,
                  callOnArrival: RESULT.callOnArrival,
                  completionStatus: RESULT.completionStatus,
                };
         RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, UserData));
        }
    })  
}

scheduleController.getSchedule = (REQUEST, RESPONSE)=>{
    let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    PROJECTION = {__v : 0, createAt: 0};

    
    MODEL.scheduleModel.findOne(CRITERIA, PROJECTION, {lean: true}).then((schedules) => {
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        return schedules;
    }).then((schedules)=>{
        var scheduleData = {
            client: schedules.client,
            quantity: schedules.quantity,
            details: schedules.details,
            address: schedules.address,
            pickUpDate: schedules.pickUpDate,
            reminder: schedules.reminder,
            callOnArrival: schedules.callOnArrival,
            completionStatus: schedules.completionStatus,
          };
          RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, scheduleData)); 
    })


}

scheduleController.getSchedules = (REQUEST, RESPONSE)=>{
    let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    PROJECTION = {__v : 0, createAt: 0};

    
    MODEL.scheduleModel.find(CRITERIA, PROJECTION, {lean: true}).then((schedules) => {
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        return schedules;
    }).then((schedules)=>{
        var scheduleData = {
            client: schedules.client,
            quantity: schedules.quantity,
            details: schedules.details,
            address: schedules.address,
            pickUpDate: schedules.pickUpDate,
            reminder: schedules.reminder,
            callOnArrival: schedules.callOnArrival,
            completionStatus: schedules.completionStatus,
          };
          RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, scheduleData)); 
    })

}


scheduleController.collectorSchedule = (REQUEST, RESPONSE)=>{
    // let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    // PROJECTION = {__v : 0, createAt: 0};

    
    MODEL.scheduleModel.find({}).then((schedules) => {
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        return schedules;
    }).then((schedules)=>{
        var scheduleData = {
            client: schedules.client,
            quantity: schedules.quantity,
            details: schedules.details,
            address: schedules.address,
            pickUpDate: schedules.pickUpDate,
            reminder: schedules.reminder,
            callOnArrival: schedules.callOnArrival,
            completionStatus: schedules.completionStatus,
          };
          RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, scheduleData)); 
    })


}

module.exports = scheduleController;
