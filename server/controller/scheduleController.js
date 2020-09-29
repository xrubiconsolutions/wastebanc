"use strict";

let scheduleController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");

var request = require("request");

const OneSignal = require("onesignal-node");

var sendNotification = function(data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8"
  };
  
  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
  };
  
  var https = require('https');
  var req = https.request(options, function(res) {  
    res.on('data', function(data) {
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });
  
  req.on('error', function(e) {
    console.log("ERROR:");
    console.log(e);
  });
  
  req.write(JSON.stringify(data));
  req.end();
};

// var message = { 
//   app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
//   contents: {"en": "English Message"},
//   include_player_ids: ["6392d91a-b206-4b7b-a620-cd68e32c3a76","76ece62b-bcfe-468c-8a78-839aeaa8c5fa"]
// };

// sendNotification(message);


scheduleController.schedule = (REQUEST, RESPONSE) => {



  var data = { ...REQUEST.body };
  MODEL.scheduleModel(data).save({}, (ERR, RESULT) => {
    try {
      if (ERR) return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
      let UserData = {
        client: RESULT.client,
        quantity: RESULT.quantity,
        details: RESULT.details,
        address: RESULT.address,
        pickUpDate: RESULT.pickUpDate,
        reminder: RESULT.reminder,
        callOnArrival: RESULT.callOnArrival,
        lat: RESULT.lat,
        long: RESULT.long,
        completionStatus: RESULT.completionStatus,
      };
      if (!RESULT.lat || !RESULT.long) {
        return RESPONSE.status(400).jsonp(RESPONSE);
      }

      return RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, UserData)
      );
    } catch (err) {
      return RESPONSE.status(400).json(err);
    }
  });
};

scheduleController.getSchedule = (REQUEST, RESPONSE) => {
  let CRITERIA = { $or: [{ client: REQUEST.query.username }] },
    PROJECTION = { __v: 0, createAt: 0 };

  MODEL.scheduleModel
    .findOne(CRITERIA, PROJECTION, { lean: true })
    .then((schedules) => {
      return RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.getSchedules = (REQUEST, RESPONSE) => {
  let CRITERIA = { $or: [{ client: REQUEST.query.username }] },
    PROJECTION = { __v: 0, createAt: 0 };
  MODEL.scheduleModel
    .find(CRITERIA, PROJECTION, { lean: true })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(500).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.collectorSchedule = (REQUEST, RESPONSE) => {
  // let CRITERIA = {$or: [{client: REQUEST.query.username}]},
  // PROJECTION = {__v : 0, createAt: 0};

  MODEL.scheduleModel
    .find({})
    .sort({ _id: -1 })
    .then((schedules) => {
      // var collect = schedules.filter(x=>x.completionStatus !== "completed")
      RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.updateSchedule = (REQUEST, RESPONSE) => {
  MODEL.userModel
    .find({ cardID: REQUEST.cardID })
    .then((result) => {
      MODEL.scheduleModel
        .find({ client: result.email, _id: REQUEST.body._id })
        .then((schedule) => {
          MODEL.scheduleModel
            .updateOne(
              { _id: schedule._id },
              { $set: { completionStatus: REQUEST.body.completionStatus } }
            )
            .then((SUCCESS) => {
              request(
                {
                  url:
                    "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
                  method: "POST",
                  json: true,
                  body: {
                    data: { username: "xrubicon", password: "xrubicon1234" },
                  },
                },
                function (error, response, body) {
                  response.headers.token;

                  request(
                    {
                      url:
                        "https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction",
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Accept-Charset": "utf-8",
                        Token: response.headers.token,
                      },
                      json: true,
                      body: {
                        data: {
                          deviceID: "DEVICE_ID", //"DEVICE_ID"
                          organizationID: "7", // 7
                          weight: REQUEST.body.weight,
                          cardID: REQUEST.body.cardID,
                        },
                      },
                    },
                    function (error, response, body) {
                      MODEL.scheduleModel.updateOne(
                        { _id: schedule._id },
                        { $set: { completionStatus: "completed" } },
                        (res) => {
                          console.log(res);
                        }
                      );
                      console.log(response);
                    }
                  );
                }
              );
              return RESPONSE.status(200).jsonp(
                COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
              );
            })
            .catch((ERR) => {
              return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
            });
        });
    })
    .catch((err) => RESPONSE.status(500).jsonp(err));

  // MODEL.scheduleModel.updateOne({_id: REQUEST.body._id},{$set: { "completionStatus" : REQUEST.body.completionStatus}}).then((SUCCESS) => {
  //     return RESPONSE.jsonp(COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED));
  // }).catch((ERR) => {
  //     return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
  // });
};

scheduleController.acceptCollection = (REQUEST, RESPONSE) => {

  var errors = {};

  MODEL.collectorModel
    .findOne({ email: REQUEST.body.client }, {}, { lean: true })
    .then((results) => {
      // if (result.roles != "collector") {
      //   errors.message = "Only a collector can accept or decline an offer";
      //   return RESPONSE.status(400).jsonp(errors);

      // } 

      // CHeck for multiple accept

      if(results) {

        MODEL.scheduleModel.findOne({"_id": REQUEST.body._id }).then((result,err)=>{

          if(err) return RESPONSE.status(400).json(err)
          if(result.collectorStatus == "accept"){
            return RESPONSE.status(400).json({message: "This schedule had been accepted by another collector"})
          }
        
          console.log("Is this a collector", results)
        MODEL.scheduleModel
        .updateOne(
          { "_id": REQUEST.body._id },
          { $set: { "collectorStatus": "accept",
                    collectedBy: results._id,
                    organisationCollection: results.approvedBy
          }}
        )
        .then((SUCCESS) => {

          MODEL.scheduleModel.findOne({"_id": REQUEST.body._id}).then((result, err)=>{
          if(err) return RESPONSE.status(400).json(err)

          MODEL.userModel.findOne({ "email": result.client }).then((result,err)=>{

              console.log("Opoor yeye", result)
            var message = { 
              app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
              contents: {"en": "A collector just accepted your schedule"},
              include_player_ids: [`${result.onesignal_id}`]
            };
            
            sendNotification(message);


          })
            
       
          


          return RESPONSE.status(200).jsonp(
            COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED, result)
          );
          })
  

        })
        .catch((ERR) => {
          return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
        });
      })
      }
     
      else {
           errors.message = "Only a collector can accept or decline an offer";
        return RESPONSE.status(400).jsonp(errors);
      }
      
    })
    .catch((err) => {
      return RESPONSE.status(500).jsonp(err);
    });
};

scheduleController.acceptAllCollections = (REQUEST, RESPONSE) => {


  var data = REQUEST.body.schedules;
  var len = data.length;

  try{

    MODEL.collectorModel  
    .findOne({ email: REQUEST.body.client }, {}, { lean: true }, (error, result) => {
      if(error) return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(error));
      
     
      else {

        var test = JSON.parse(JSON.stringify(data))


        for (var i = 0 ; i < test.length ; i++){
            MODEL.scheduleModel
            .updateOne(
              { "_id" : test[i]._id},
              {$set: { "collectorStatus" : "accept",
            
              collectedBy: result._id,
              organisationCollection: result.approvedBy
            }}, 
  
              (err,res)=>{

                // if(!res.nModified) {
                //     console.log("Index here is", i)
                //    return RESPONSE.status(400).jsonp({message: "This schedule has already been accepted by another recycler"})
                //    return false;
                // }


                console.log("data is real", test[0]);



             


    

                }
            )


               MODEL.scheduleModel.findOne({"_id" : test[i]._id}).then(credential => {

                  MODEL.userModel.findOne({ "email": credential.client }).then((result,err)=>{

                  var message = { 
                    app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                    contents: {"en": "A collector just accepted your schedule"},
                    include_player_ids: [`${result.onesignal_id}`]
                  };
                  
                  sendNotification(message);
      
      
                })


                })

        }

        return RESPONSE.status(200).jsonp({message: "All schedules accepted successfully"});           


      } 
    })
  }
  catch(err){
    return RESPONSE.status(500).jsonp(err)
  }

  
};

scheduleController.allMissedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "missed", client: REQUEST.query.client })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};


scheduleController.allUserMissedSchedules = (REQUEST, RESPONSE) => {
  var user = REQUEST.query.email
  MODEL.scheduleModel
    .find({ completionStatus: "completed", client: user })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};



scheduleController.viewAllSchedules = (REQUEST, RESPONSE) => {
  // let CRITERIA = {$or: [{client: REQUEST.query.username}]},
  // PROJECTION = {__v : 0, createAt: 0};

  MODEL.scheduleModel
    .find({})
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};


scheduleController.allPendingSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "pending", client: REQUEST.query.client })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.allCompletedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "completed", client: REQUEST.query.client })
    .then((schedules) => {
      console.log("Completed schedules here", schedules)
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.dashboardCompleted = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "completed" })
    .then((schedules) => {
      console.log("Completed schedules here", schedules)
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};




scheduleController.rewardSystem = (req, resp) => {

  const collectorID = req.body.collectorID;
  const quantity = req.body.quantity;
  // MODEL.collectorModel.find({
  //   _id: collectorID
  // }).then((err,resp)=>{
  //   if(err) return  res.status(400).jsonp(err)
  // }).catch(err=>res.status(500).jsonp(err))

  if(!quantity) return resp.status(400).json({message: "Enter a valid input for the quantity"})
  

  try {


  MODEL.scheduleModel.find({ _id: req.body._id }).then((schedule) => {
    // console.log("Whats going on here", schedule )
    if(!schedule[0]) return resp.status(400).json({message: "This schedule is invalid"})
    MODEL.userModel.findOne({ email: schedule[0].client }).then((result) => {
      if(result.cardID == null) return resp.status(400).jsonp({message: "you don't have a valid card ID"})
  MODEL.transactionModel.findOne({ scheduleId: req.body._id }).then((transaction) => {

    // console.log("transaction here at all ? ", transaction)

      if(transaction){
        return resp.status(400).jsonp({message: "This transaction had been completed by another recycler"})
      }
      // console.log("transaction here", transaction)
      
      request(
        {
          url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
          method: "POST",
          json: true,
          body: { data: { username: "xrubicon", password: "xrubicon1234" } },
        },
        function (error, response, body) {
          request(
            {
              url:
                "https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction",
              method: "POST",
              headers: {
                Accept: "application/json",
                "Accept-Charset": "utf-8",
                Token: response.headers.token,
              },
              json: true,
              body: {
                data: {
                  deviceID: "XRUBICON", //"DEVICE_ID"
                  organizationID: "7", // 7
                  // weight: schedule[0].quantity,
                  weight: quantity,
                  cardID: result.cardID,
                },
              },
            },
            function (err, response) {
              console.log("IS this even an error", response.body.content.data)
              //Coin reward system
              if (err) return res.status(400).jsonp(err);
              if (response.body.content.data) {
                var coin_reward = response.body.content.data.customer.availablePoints
                console.log("My coin reward is here guys", coin_reward)
                MODEL.scheduleModel.updateOne(
                  { "_id": schedule[0]._id },
                  { $set: { completionStatus: "completed",
                            collectedBy: collectorID                 
                } },
                  (err, res) => {
                    if (err) return res.status(400).jsonp(response.body.error);
                    else {
                      MODEL.userModel.updateOne(
                        { email : result.email },
                        { $set: { availablePoints: coin_reward,
                                  
                        } }, (err,res)=>{
                          console.log("Was this actually updated", res)

                          MODEL.collectorModel.findOne({"_id": collectorID}).then((recycler, err)=>{
                            console.log("All i need here", recycler)
                            console.log("Whatsyo", err)

                            var dataToSave = {

                              "weight": quantity,
                            
                              "coin": response.body.content.data.point,
                            
                              "cardID": result.cardID,
  
                              "scheduleId": schedule[0]._id,
                            
                              "completedBy": collectorID,
  
                              "Category": schedule[0].Category,

                              "fullname": result.fullname,

                              "recycler" : recycler.fullname,
  
                              "organisationID" : recycler.approvedBy
                            }
                                
                          MODEL.transactionModel(dataToSave).save({}, (ERR, RESULT) => {


                            var message = { 
                              app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                              contents: {"en": "You just received a payout for your schedule"},
                              include_player_ids: [`${result.onesignal_id}`]
                            };
                            
                            sendNotification(message);
                            
                            if(ERR) return resp.status(400).jsonp(ERR)
                              console.log("Transaction saved on database", RESULT)
                           })

                          })
                     
                        }
                      );
                    } 
                  }
                );
              } else {
                var error = {};
                error.message = "Transaction incomplete, coin not credited";
                return resp.status(400).jsonp(error);
              }
              // client
              // .createNotification(notification)
              // .then((response) => { console.log (response)})
              // .catch((e) => {console.error(e)});
              return resp.status(200).jsonp(response.body.content.data);
            }
          );
        }
      );
    });
  }).catch(err=>{  console.log(err);   return resp.status(500).jsonp(err) })
  });



  }
  catch(err){
    return resp.status(500).json(err)
  }

};

scheduleController.allAgentTransaction = (req, res) => {
  let cardID = req.query.cardID;

  request(
    {
      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
      method: "POST",
      json: true,
      body: { data: { username: "xrubicon", password: "xrubicon1234" } },
    },
    function (error, response, body) {
      request(
        {
          url: `https://apis.touchandpay.me/lawma-backend/v1/agent/get/agent/transactions`,
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
            Token: response.headers.token,
          },
          json: true,
        },
        function (err, response) {
          console.log(response);
          return res.jsonp(response.body.content.data.reverse().slice(0, 5));
        }
      );
    }
  );
};

scheduleController.getBalance = (req, res) => {
  let cardID = req.query.cardID;

  request(
    {
      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
      method: "POST",
      json: true,
      body: { data: { username: "xrubicon", password: "xrubicon1234" } },
    },
    function (error, response, body) {
      request(
        {
          url: `https://apis.touchandpay.me/lawma-backend/v1/agent/get/customer/card/${cardID}`,
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
            Token: response.headers.token,
          },
          json: true,
        },
        function (err, response) {
          // console.log(response)
          return res.jsonp(response.body.content.data.reverse().slice(0, 5));
        }
      );
    }
  );
};

scheduleController.allWeight = (req, res) => {
  MODEL.scheduleModel
    .find({})
    .sort({ _id: -1 })
    .then((schedules) => {
      var test = JSON.parse(JSON.stringify(schedules));
      let weight = test.map(x=>x.quantity).reduce((acc, curr) => {
        return acc + curr;
      });
      res.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, weight)
      );
    })
    .catch((err) => res.status(400).jsonp(COMMON_FUN.sendError(err)));
};



scheduleController.allCoins = (req, res)=>{

  request(
    {
      url:
        "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
      method: "POST",
      json: true,
      body: {
        data: { username: "xrubicon", password: "xrubicon1234" },
      },
    },
    function (error, response, body) {
      response.headers.token;

      request(
        {
          url:
            "https://apis.touchandpay.me/lawma-backend/v1/agent/get/agent/transactions",
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
            Token: response.headers.token,
          },
          json: true,
        },
        function (error, response, body) {
          if(error) return res.status(400).jsonp(error)
          var rubicon = JSON.parse(JSON.stringify(response.body.content.data));
          var needed = rubicon.filter(x=>x.deviceID == "xrubicon") || []

          console.log("Error just here",needed)

          if(!needed) {
            return RESPONSE.status(400).json({
              message  : "No coin data"
            })
          }

          const test = JSON.parse(JSON.stringify(needed));
          
          // const allCoins = test.map(x=>x.point).reduce((acc,curr) => {
          //   return Number(acc) + Number(curr)
          // })

        const totalCoin = 5;
         return res.status(200).jsonp(
            COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, totalCoin)
          );

        }
      );
    }
  );
}



scheduleController.allAccepted = (REQUEST,RESPONSE)=>{
  MODEL.scheduleModel
  .find({ collectorStatus: "accept"})
  .then((schedules) => {
    RESPONSE.status(200).jsonp(
      COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
    );
  })
  .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
}

scheduleController.userComplete = (req,resp)=>{

  var scheduleID = req.body._id;
  var userID = req.body.userID;
  var rating = req.body.rating;
  var comment = req.body.comment;
  
  try {

    MODEL.scheduleModel.find({ _id: scheduleID}).then((schedule) => {
      MODEL.userModel.find({ _id: userID }).then((result) => {
    MODEL.scheduleModel.updateOne(
      { "_id": scheduleID },
      { $set: { completionStatus: "completed" ,
                rating : rating,
                comment: comment
    } },
      (err, res) => {
        if (err) return resp.status(400).jsonp(response.body.error);
        return resp.status(200).jsonp({message: "Your schedule update was successful"})
      }
    );
      })
    })
  }
  catch (err) {
    return resp.status(404),jsonp(err)
  }

}


scheduleController.userDelete = (req,resp)=>{

  var scheduleID = req.body._id;
  var userID = req.body.userID;
  
  try {

    MODEL.scheduleModel.find({ _id: scheduleID}).then((schedule) => {
      MODEL.userModel.find({ _id: userID }).then((result) => {
    MODEL.scheduleModel.deleteOne(
      { "_id": scheduleID },
      (err, res) => {
        if (err) return resp.status(400).jsonp(response.body.error);
        return resp.status(200).jsonp({message: "Your schedule delete was successful"})
      }
    );
      })
    })
  }
  catch (err) {
    return resp.status(404),jsonp(err)
  }

}

scheduleController.userCancel = (req,resp)=>{

  var scheduleID = req.body._id;
  var userID = req.body.userID;
  var reason = req.body.reason;
  
  try {

    MODEL.scheduleModel.find({ _id: scheduleID}).then((schedule) => {
      MODEL.userModel.find({ _id: userID }).then((result) => {
    MODEL.scheduleModel.updateOne(
      { "_id": scheduleID },
      { $set: { completionStatus: "cancelled" , 
                cancelReason : reason 
      } },
      (err, res) => {
        if (err) return resp.status(400).jsonp(response.body.error);
        return resp.status(200).jsonp({message: "Your schedule cancellation was successful"})
      }
    );
      })
    })
  }
  catch (err) {
    return resp.status(404),jsonp(err)
  }

}








scheduleController.allDeclined = (REQUEST,RESPONSE)=>{
  MODEL.scheduleModel
  .find({ collectorStatus: "decline"})
  .then((schedules) => {
    RESPONSE.status(200).jsonp(
      COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
    );
  })
  .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
}


scheduleController.smartRoute = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.collectorID;
  var need = [];
  var count = 0;
  var geofencedSchedules = [];


  MODEL.collectorModel.findOne({ _id: collectorID }).then((collector) => {
    var accessArea = collector.areaOfAccess;

    MODEL.scheduleModel
      .find({})
      .sort({ _id: -1 })
      .then((schedules) => {
        schedules.forEach((schedule, index) => {
          var test = schedule.address.split(", ");
          (function route() {
            for (let i = 0; i < accessArea.length; i++) {
              for (let j = 0; j < test.length; j++) {
                if (accessArea[i].includes(test[j])) {
                  need.push(test[j]);
                  geofencedSchedules.push(schedule)
                  count++           
                }
              }
            }
            return !!need;
          })()
      


        });
        var geoSchedules = geofencedSchedules.filter(x=>(x.completionStatus !== "completed" && x.completionStatus !== "cancelled" && x.completionStatus !== "missed"))
        RESPONSE.jsonp(
          COMMON_FUN.sendSuccess(
            CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
            geoSchedules
          )
        );
      })
      .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
  });
};


scheduleController.afterCompletion = (REQUEST,RESPONSE) => {
  const collectorID = REQUEST.query.collectorID;

  MODEL.collectorModel.findOne({ _id : collectorID }).then((collector)=>{
    if(!collector) {
      return RESPONSE.status(400).json({message: "Not a valid collector ID"})
    }

    MODEL.scheduleModel.find({ collectedBy : collectorID , completionStatus: "pending" }).then((result,err)=>{
      

      if(err) return RESPONSE.status(400).json(err)

      return RESPONSE.status(200).json(result)

    })
    

  })
}



scheduleController.collectorMissed = (req,res)=>{
  const scheduleID = req.body.scheduleID;
  const collectorID = req.body.collectorID


    try {

        MODEL.scheduleModel.findOne({_id: scheduleID}).then(result=>{
          if(!result) return res.status(400).json({
            message: "This schedule is invalid"
          })

          if(result.collectedBy !== collectorID) return res.status(400).json({
            message : "You didn't accept this schedule"
          })

          MODEL.scheduleModel.updateOne(
            { "_id" : result._id},
            {$set: { "completionStatus" : "missed",
                    }}
                    ).then((resp,err)=>{

                            return res.status(200).json({
                              message: "You missed this schedule"
                            })

                      console.log(err)

                    })


        })

    } catch(err){
        return res.status(500).json(err)

    }
}




module.exports = scheduleController;
