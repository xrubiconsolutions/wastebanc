"use strict"; 

let scheduleController      = {};
let MODEL               = require("../models");
let COMMON_FUN          = require("../util/commonFunction");
let CONSTANTS           = require("../util/constants");


var request = require("request");

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
                      geolocation: RESULT.geolocation,
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

    // request(
    //     {
    //       url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
    //       method: "POST",
    //       json: true,
    //       body: { data: { username: "xrubicon", password: "xrubicon1234" } },
    //     },
    //     function (error, response, body) {
    //      response.headers.token
    //     }
    //   );

   
    MODEL.userModel.find({'cardID': REQUEST.cardID}).then((result)=>{
        MODEL.scheduleModel.find({client: result.email , _id: REQUEST.body._id}).then( schedule => {
            MODEL.scheduleModel.updateOne({_id: schedule._id},{$set: { "completionStatus" : REQUEST.body.completionStatus}}).then((SUCCESS) => {   
                
                request(
                    {
                      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
                      method: "POST",
                      json: true,
                      body: { data: { username: "xrubicon", password: "xrubicon1234" } },
                    },
                    function (error, response, body) {
                     response.headers.token

                     request({
                        url: "https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction",
                        method: "POST",
                        headers: {
                            'Accept': 'application/json',
                            'Accept-Charset': 'utf-8',
                            'Token': response.headers.token
                               },
                        json: true,
                        body:  {
                          "data": {
                            "deviceID": "DEVICE_ID", //"DEVICE_ID"
                            "organizationID": "7", // 7
                            "weight": REQUEST.body.weight,
                            "cardID": REQUEST.body.cardID
                          }
                        }
                      },
                        function(error, response, body) {
                          console.log(response);
                        }
                      );   


                    }
                  );

                // request({
                //     url: "https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction",
                //     method: "POST",
                //     headers: {
                //         'Accept': 'application/json',
                //         'Accept-Charset': 'utf-8',
                //         'Token': "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MTAsInVzZXJuYW1lIjoieHJ1Ymljb24iLCJmaXJzdG5hbWUiOiJYcnViaWNvbiIsImxhc3RuYW1lIjoiWHJ1Ymljb24iLCJvdGhlcm5hbWVzIjoiIiwicGhvbmUiOiIwODAzNDUyNDc1MyIsImVtYWlsIjoiaGVsb0B4cnViaWNvbi5jb20iLCJhZGRyZXNzIjoiTGFnb3MiLCJvcmdhbml6YXRpb25JRCI6NywidXNlcnR5cGUiOjIsInB1YmxpY0tleSI6Ik4zSkYzdHVKVlFPeiIsImlzcyI6InBheXJvbGxtbmdyIiwiYXVkIjoicGF5cm9sbG1uZ3IiLCJpYXQiOjE1OTcyNzkyNjcsIm5iZiI6MTU5NzI3OTI2N30.LTr76ZZH6Xe9raRBT3n7yssb9CeqU1fMLV_ogBbtavs",
                //     },
                //     json: true,
                //     body:  {
                //       "data": {
                //         "deviceID": "DEVICE_ID", //"DEVICE_ID"
                //         "organizationID": "7", // 7
                //         "weight": SUCCESS.quantity,
                //         "cardID": SUCCESS.cardID
                //       }
                //     }
                //   },
                //     function(error, response, body) {
                //       console.log(body);
                //       console.log(response);
                //     }
                //   );            
                  return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED));
            }).catch((ERR) => {
                return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
            });

        })
    }).catch(err=>RESPONSE.jsonp(err));

    // MODEL.scheduleModel.updateOne({_id: REQUEST.body._id},{$set: { "completionStatus" : REQUEST.body.completionStatus}}).then((SUCCESS) => {
    //     return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED));
    // }).catch((ERR) => {
    //     return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    // });

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


scheduleController.rewardSystem = (req, res)=> {

  MODEL.userModel.find({"cardID": req.body.cardID}).then(result=>{
    MODEL.scheduleModel.find({"_id": req.body._id}).then(schedule => {
      // console.log("schedule here", schedule[0].quantity)
      request(
        {
          url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
          method: "POST",
          json: true,
          body: { data: { username: "xrubicon", password: "xrubicon1234" } },
        },
        function (error, response, body){
         request({
          url: "https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction",
          method: "POST",
          headers:{
              'Accept': 'application/json',
              'Accept-Charset': 'utf-8',
              'Token': response.headers.token
          },
          json: true,
          body:  {
            "data": {
                    "deviceID": "XRUBICON", //"DEVICE_ID"
                    "organizationID": "7", // 7
                    "weight": schedule[0].quantity,
                    "cardID": req.body.cardID,
              }
          }
        }, function(err,response){
          // console.log(response)
         return res.jsonp(response.body.content.data)

        }
     )
      }
      )
    }
    )
  }
  )

}

scheduleController.allAgentTransaction = (req,res)=>{

  request(
    {
      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
      method: "POST",
      json: true,
      body: { data: { username: "xrubicon", password: "xrubicon1234" } },
    },
    function (error, response, body){

     request({
      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/get/agent/transactions",
      method: "GET",
      headers:{
          'Accept': 'application/json',
          'Accept-Charset': 'utf-8',
          'Token': response.headers.token
      },
      json: true,
    }, function(err,response){
      // console.log(response)
     return res.jsonp(response.body.content.data.reverse().slice(0,5))

    }
 )
}

  )
}





module.exports = scheduleController;





