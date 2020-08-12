"use strict"; 

let scheduleController      = {};
let MODEL               = require("../models");
let COMMON_FUN          = require("../util/commonFunction");
let CONSTANTS           = require("../util/constants");



const OneSignal = require('onesignal-node');    

const client = new OneSignal.Client('9ca54830-96be-4c58-9c8a-a024a0960acd', 'NzJhMmMwYjctZjA0My00NzMyLWExMTQtZGZkZTBjZmFmOTY0', { apiRoot: 'https://onesignal.com/api/v2'});

scheduleController.schedule = (REQUEST, RESPONSE)=>{
    var data = { ...REQUEST.body };

    const notification = {
        contents: {
          'en': 'There is a new schedule',
        },
        included_segments: ['Subscribed Users'],
        filters: [
          { field: 'tag', key: 'level', relation: '>', value: 10 }
        ]
      };

     
    
    MODEL.scheduleModel(data).save({},(ERR, RESULT) => {
            if(ERR) {
                return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
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

                    client.createNotification(notification)
                    .then(response => { console.log(response)})
                    .catch(e => { console.log(e)});
                          
            return  RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, UserData));
            }
        })
    }
 

scheduleController.getSchedule = (REQUEST, RESPONSE)=>{
    let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    PROJECTION = {__v : 0, createAt: 0};

        MODEL.scheduleModel.findOne(CRITERIA, PROJECTION, {lean: true}).then((schedules)=>{
        return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        }).catch(err=>RESPONSE.jsonp(COMMON_FUN.sendError(err)))
}

scheduleController.getSchedules = (REQUEST, RESPONSE)=>{
    let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    PROJECTION = {__v : 0, createAt: 0};
      MODEL.scheduleModel.find(CRITERIA, PROJECTION, {lean: true}).then((schedules)=>{
    RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        }).catch(err=>RESPONSE.jsonp(COMMON_FUN.sendError(err)))
}


scheduleController.collectorSchedule = (REQUEST, RESPONSE)=>{
    // let CRITERIA = {$or: [{client: REQUEST.query.username}]},
    // PROJECTION = {__v : 0, createAt: 0};

        MODEL.scheduleModel.find({}).sort({"pickUpDate" : -1}).then((schedules)=>{
        console.log(schedules)
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules));
        
        }).catch (err=> RESPONSE.jsonp(COMMON_FUN.sendError(err))) 
}


scheduleController.updateSchedule = (REQUEST, RESPONSE)=>{

 

    MODEL.scheduleModel.updateOne({_id: REQUEST.body._id},{$set: { "completionStatus" : REQUEST.body.completionStatus}}).then((SUCCESS) => {
        return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED));
    }).catch((ERR) => {
        return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    });

}

scheduleController.acceptCollection = (REQUEST, RESPONSE) =>{

    var errors = {};

    const notification = {
        contents: {
          'en': 'Your schedule was just accepted',
        },
        included_segments: ['Subscribed Users'],
        filters: [
          { field: 'tag', key: 'level', relation: '>', value: 10 }
        ]
      };

    MODEL.userModel.findOne({email: REQUEST.body.client},{},{lean: true}).then(result=>{ if(result.roles != "collector"){
        errors.message = "Only a collector can accept or decline an offer";
        return RESPONSE.jsonp(errors);
    } else {

        MODEL.scheduleModel.updateOne({_id: REQUEST.body._id},{$set: { "collectorStatus" : REQUEST.body.collectorStatus}}).then((SUCCESS) => {
            client.createNotification(notification)
            .then(response => { console.log(response)})
            .catch(e => { console.log(e)});
                  
            return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED));
        }).catch((ERR) => {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        });
    }}).catch((err)=> { return RESPONSE.jsonp(err)}
    )

}

scheduleController.allMissedSchedules = (REQUEST, RESPONSE) =>{
    MODEL.scheduleModel.find({ completionStatus: "missed", client: REQUEST.body.client}).then((schedules)=>{
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        }).catch (err=> RESPONSE.jsonp(COMMON_FUN.sendError(err))) 

}
  

scheduleController.allPendingSchedules = (REQUEST, RESPONSE) =>{
    MODEL.scheduleModel.find({ completionStatus: "pending", "client": REQUEST.body.client}).then((schedules)=>{
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        }).catch (err=> RESPONSE.jsonp(COMMON_FUN.sendError(err))) 

}

scheduleController.allCompletedSchedules = (REQUEST, RESPONSE) =>{
    MODEL.scheduleModel.find({ completionStatus: "completed", client: REQUEST.body.client}).then((schedules)=>{
        RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)); 
        }).catch (err=> RESPONSE.jsonp(COMMON_FUN.sendError(err))) 

}
  
  



module.exports = scheduleController;

