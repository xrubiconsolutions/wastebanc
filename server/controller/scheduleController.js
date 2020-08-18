"use strict";

let scheduleController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");

var request = require("request");

const OneSignal = require("onesignal-node");

const client = new OneSignal.Client(
  "9ca54830-96be-4c58-9c8a-a024a0960acd",
  "NzJhMmMwYjctZjA0My00NzMyLWExMTQtZGZkZTBjZmFmOTY0",
  { apiRoot: "https://onesignal.com/api/v2" }
);

scheduleController.schedule = (REQUEST, RESPONSE) => {

  const notification = {
    contents: {
      'en': `A new schedule was made by ${REQUEST.body.client}`,
    },
    included_segments: ['Subscribed Users'],
    // filters: [
    //   { field: 'tag', key: 'level', relation: '>', value: 10 }
    // ]
  };



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

      client
        .createNotification(notification)
        .then((response) => { console.log (response)})
        .catch((e) => {console.error(e)});

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
      var collect = schedules.filter(x=>x.completionStatus !== "completed")
      RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, collect)
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





  const notification = {
    contents: {
      'en': `A collector just accepted your schedule pick up`,
    },
    included_segments: ['Subscribed Users'],
    // filters: [
    //   { field: 'tag', key: 'level', relation: '>', value: 10 }
    // ]
  };


  var errors = {};

  MODEL.userModel
    .findOne({ email: REQUEST.body.client }, {}, { lean: true })
    .then((result) => {
      if (result.roles != "collector") {
        errors.message = "Only a collector can accept or decline an offer";
        return RESPONSE.status(400).jsonp(errors);
      } else {
        MODEL.scheduleModel
          .updateOne(
            { _id: REQUEST.body._id },
            { $set: { collectorStatus: REQUEST.body.collectorStatus } }
          )
          .then((SUCCESS) => {
            client
            .createNotification(notification)
            .then((response) => { console.log (response)})
            .catch((e) => {console.error(e)});
    

            return RESPONSE.status(200).jsonp(
              COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
            );
          })
          .catch((ERR) => {
            return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
          });
      }
    })
    .catch((err) => {
      return RESPONSE.status(500).jsonp(err);
    });
};

scheduleController.allMissedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "missed", client: REQUEST.body.client })
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
    .find({ completionStatus: "pending", client: REQUEST.body.client })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.allCompletedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: "completed", client: REQUEST.body.client })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.rewardSystem = (req, res) => {

  const notification = {
    contents: {
      'en': `You got credited with coins from packam`,
    },
    included_segments: ['Subscribed Users'],
    // filters: [
    //   { field: 'tag', key: 'level', relation: '>', value: 10 }
    // ]
  };


  MODEL.scheduleModel.find({ _id: req.body._id }).then((schedule) => {
    MODEL.userModel.find({ email: schedule[0].client }).then((result) => {
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
                  weight: schedule[0].quantity,
                  cardID: result[0].cardID,
                },
              },
            },
            function (err, response) {
              //Coin reward system

              if (err) return res.status(400).jsonp(err);
              if (!!response.body.content.data[0]) {
                var coin_reward = response.body.content.data.customer.availablePoints
                MODEL.scheduleModel.updateOne(
                  { "_id": schedule[0]._id },
                  { $set: { completionStatus: "completed" } },
                  (err, res) => {
                    if (err) return res.status(400).jsonp(response.body.error);
                    MODEL.userModel.updateOne(
                      { "email" : result[0].email },
                      { $set: { "availablePoints": coin_reward } }
                    );
                  }
                );
              } else {
                var error = {};
                error.message = "Transaction incomplete, coin not credited";
                return res.status(400).jsonp(error);
              }
              client
              .createNotification(notification)
              .then((response) => { console.log (response)})
              .catch((e) => {console.error(e)});
      
              return res.status(200).jsonp(response.body.content.data);
            }
          );
        }
      );
    });
  });
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
      let weight = test.reduce((acc, curr) => {
        return acc.quantity + curr.quantity;
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
          var needed = rubicon.filter(x=>x.deviceID == "xrubicon")

          const test = JSON.parse(JSON.stringify(needed));
          
          const allCoins = test.map(x=>x.point).reduce((acc,curr) => {
            return Number(acc) + Number(curr)
          })
         return res.status(200).jsonp(
            COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, allCoins)
          );

        }
      );
    }
  );



}

module.exports = scheduleController;
