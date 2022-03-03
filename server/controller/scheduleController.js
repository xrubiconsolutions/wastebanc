"use strict";

let scheduleController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");
const moment = require("moment-timezone");
const mongo = require("mongodb");

moment().tz("Africa/Lagos", false);
const { validationResult, body } = require("express-validator");
var request = require("request");

const OneSignal = require("onesignal-node");

var sendNotification = function (data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      console.log(JSON.parse(data));
    });
  });

  req.on("error", function (e) {
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

const bodyValidate = (req, res) => {
  // 1. Validate the request coming in
  // console.log(req.body);
  const result = validationResult(req);

  const hasErrors = !result.isEmpty();

  if (hasErrors) {
    //   debugLog('user body', req.body);
    // 2. Throw a 422 if the body is invalid
    return res.status(422).json({
      error: true,
      statusCode: 422,
      message: "Invalid body request",
      errors: result.array({ onlyFirstError: true }),
    });
  }
  return;
};

// var message = {
//   app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
//   contents: {"en": "English Message"},
//   include_player_ids: ["6392d91a-b206-4b7b-a620-cd68e32c3a76","76ece62b-bcfe-468c-8a78-839aeaa8c5fa"]
// };

// sendNotification(message);

scheduleController.schedule = (REQUEST, RESPONSE) => {
  var data = { ...REQUEST.body };

  //console.log("data", data);

  if (moment(data.pickUpDate) < moment()) {
    return RESPONSE.status(400).json({
      statusCode: 400,
      customMessage: "Invalid date",
    });
  }

  MODEL.userModel.findOne({ email: REQUEST.body.client }).then((result) => {
    MODEL.userModel.updateOne(
      { email: REQUEST.body.client },
      { last_logged_in: new Date() },
      (res) => {
        console.log("Logged date updated", new Date());
      }
    );

    if (result.cardID == null) {
      return RESPONSE.status(400).json({
        message: "You don't have a valid card ID, contact support for help",
      });
    }

    const expireDate = moment(data.pickUpDate, "YYYY-MM-DD").add(7, "days");
    data.expiryDuration = expireDate;

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
          lcd: RESULT.lcd || "",
          completionStatus: RESULT.completionStatus,
          categories: RESULT.categories,
        };
        if (!RESULT.lat || !RESULT.long) {
          return RESPONSE.status(400).json({
            message: "Location Invalid",
          });
        }
        const lcd = UserData.lcd;

        MODEL.collectorModel
          .aggregate([
            {
              $match: {
                areaOfAccess: { $in: [lcd] },
              },
            },
          ])
          .then((recycler) => {
            for (let i = 0; i < recycler.length; i++) {
              var message = {
                app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                contents: {
                  en: `A user in ${lcd} just created a schedule`,
                },
                include_player_ids: [`${recycler[i].onesignal_id} || ' '`],
              };
              sendNotification(message);
              const datum = {
                title: "Schedule made",
                lcd: lcd,
                message: `A schedule was made in ${lcd}`,
                recycler_id: recycler[i]._id,
              };
              MODEL.notificationModel(datum).save({}, (err, data) => {
                console.log("-->", data);
              });
            }
          });
        return RESPONSE.status(200).jsonp(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, UserData)
        );
      } catch (err) {
        return RESPONSE.status(400).json(err);
      }
    });
  });
};

scheduleController.scheduleNotifications = (req, res) => {
  const id = req.query.id;
  try {
    console.log("-->", id);
    MODEL.notificationModel
      .find({
        recycler_id: id,
        seenNotification: false,
      })
      .then((notif) => {
        return res.status(200).json(notif);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

/* Update Notification */
scheduleController.updateScheduleNotifications = (req, res) => {
  const id = req.query.id;
  try {
    MODEL.notificationModel.updateOne(
      {
        _id: id,
      },
      {
        $set: { seenNotification: true },
      },
      (err, result) => {
        return res.status(200).json({
          message: "Notification message seen",
        });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
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
  try {
    MODEL.userModel.find({ cardID: REQUEST.cardID }).then((result) => {
      MODEL.scheduleModel
        .find({ client: result.email, _id: REQUEST.body._id })
        .then((schedule) => {
          MODEL.scheduleModel
            .updateOne(
              { _id: schedule._id },
              {
                $set: {
                  completionStatus: REQUEST.body.completionStatus,
                  categories: REQUEST.body.categories || schedule.categories,
                },
              }
            )
            .then((SUCCESS) => {
              MODEL.scheduleModel.updateOne(
                { _id: schedule._id },
                { $set: { completionStatus: "completed" } },
                (res) => {
                  return RESPONSE.status(200).jsonp(
                    COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
                  );
                }
              );
            });
        });
    });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};
// request(
//   {
//     url:
//       'https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent',
//     method: 'POST',
//     json: true,
//     body: {
//       data: { username: 'xrubicon', password: 'xrubicon1234' },
//     },
//   },
//   // function (error, response, body) {
//   //   response.headers.token;

//   //   request(
//   //     {
//   //       url:
//   //         'https://apis.touchandpay.me/lawma-backend/v1/agent/create/agent/transaction',
//   //       method: 'POST',
//   //       headers: {
//   //         Accept: 'application/json',
//   //         'Accept-Charset': 'utf-8',
//   //         Token: response.headers.token,
//   //       },
//   //       json: true,
//   //       body: {
//   //         data: {
//   //           deviceID: 'DEVICE_ID', //"DEVICE_ID"
//   //           organizationID: '7', // 7
//   //           weight: REQUEST.body.weight,
//   //           cardID: REQUEST.body.cardID,
//   //         },
//   //       },
//   //     },
//   //     function (error, response, body) {
//   //       MODEL.scheduleModel.updateOne(
//   //         { _id: schedule._id },
//   //         { $set: { completionStatus: 'completed' } },
//   //         (res) => {
//   //           console.log(res);
//   //         }
//   //       );
//   //       console.log(response);
//   //     }
//   //   );
//   // }
// );
// .catch((ERR) => {
//   return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
// });

scheduleController.acceptCollection = (REQUEST, RESPONSE) => {
  var errors = {};

  MODEL.collectorModel
    .findOne({ email: REQUEST.body.client }, {}, { lean: true })
    .then((results) => {
      if (results) {
        MODEL.scheduleModel
          .findOne({ _id: REQUEST.body._id })
          .then((result, err) => {
            if (err) return RESPONSE.status(400).json(err);
            if (result.collectorStatus == "accept") {
              return RESPONSE.status(400).json({
                message: "This schedule had been accepted by another collector",
              });
            }

            MODEL.scheduleModel
              .updateOne(
                { _id: REQUEST.body._id },
                {
                  $set: {
                    collectorStatus: "accept",
                    collectedBy: results._id,
                    organisation: results.organisation,
                    organisationCollection: results.approvedBy,
                    recycler: results.fullname,
                  },
                }
              )
              .then((SUCCESS) => {
                MODEL.scheduleModel
                  .findOne({ _id: REQUEST.body._id })
                  .then((result, err) => {
                    if (err) return RESPONSE.status(400).json(err);

                    MODEL.userModel
                      .findOne({ email: result.client })
                      .then((result, err) => {
                        var message = {
                          app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                          contents: {
                            en: "A collector just accepted your schedule",
                          },
                          include_player_ids: [`${result.onesignal_id}`],
                        };

                        sendNotification(message);
                      });

                    MODEL.collectorModel.updateOne(
                      {
                        _id: results._id,
                      },
                      {
                        $set: {
                          busy: true,
                        },
                      },
                      (err, resp) => console.log("collector updated")
                    );

                    return RESPONSE.status(200).jsonp(
                      COMMON_FUN.sendSuccess(
                        CONSTANTS.STATUS_MSG.SUCCESS.UPDATED,
                        result
                      )
                    );
                  });
              })
              .catch((ERR) => {
                return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
              });
          });
      } else {
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

  try {
    MODEL.collectorModel.findOne(
      { email: REQUEST.body.client },
      {},
      { lean: true },
      (error, result) => {
        if (error)
          return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(error));
        else {
          var test = JSON.parse(JSON.stringify(data));

          for (var i = 0; i < test.length; i++) {
            MODEL.scheduleModel.updateOne(
              { _id: test[i]._id },
              {
                $set: {
                  collectorStatus: "accept",
                  organisation: result.organisation,
                  collectedBy: result._id,
                  organisationCollection: result.approvedBy,
                  recycler: result.recycler,
                },
              },

              (err, res) => {
                console.log("data", test[0]);
              }
            );

            MODEL.scheduleModel
              .findOne({ _id: test[i]._id })
              .then((credential) => {
                MODEL.userModel
                  .findOne({ email: credential.client })
                  .then((result, err) => {
                    var message = {
                      app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                      contents: {
                        en: "A collector just accepted your schedule",
                      },
                      include_player_ids: [`${result.onesignal_id}`],
                    };

                    sendNotification(message);
                  });
              });
          }

          return RESPONSE.status(200).jsonp({
            message: "All schedules accepted successfully",
          });
        }
      }
    );
  } catch (err) {
    return RESPONSE.status(500).jsonp(err);
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
  var user = REQUEST.query.email;
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
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.rewardSystem = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.body.collectorID;
  const quantity = REQUEST.body.quantity;
  if (!quantity)
    return RESPONSE.status(400).json({
      message: "Enter a valid input for the quantity",
    });

  try {
    MODEL.scheduleModel.find({ _id: REQUEST.body._id }).then((schedule) => {
      if (!schedule[0])
        return RESPONSE.status(400).json({
          message: "This schedule is invalid",
        });
      MODEL.userModel.findOne({ email: schedule[0].client }).then((result) => {
        if (result.cardID == null)
          return RESPONSE.status(400).jsonp({
            message: "you don't have a valid card ID",
          });
        MODEL.transactionModel
          .findOne({ scheduleId: REQUEST.body._id })
          .then((transaction) => {
            if (transaction) {
              return RESPONSE.status(400).jsonp({
                message:
                  "This transaction had been completed by another recycler",
              });
            } else {
              //100g is equivalent to 1 coin i.e 1kg is equivalent to 10 coins
              // quantity in g

              // var equivalent = (quantity / 1000) * 10;
              MODEL.collectorModel
                .findOne({ _id: collectorID })
                .then((recycler, err) => {
                  MODEL.organisationModel
                    .findOne({
                      _id: recycler.approvedBy,
                    })
                    .then((organisation) => {
                      var category =
                        schedule[0].Category === "nylonSachet"
                          ? "nylon"
                          : schedule[0].Category === "glassBottle"
                          ? "glass"
                          : schedule[0].Category.length < 4
                          ? schedule[0].Category.substring(
                              0,
                              schedule[0].Category.length
                            )
                          : schedule[0].Category.substring(
                              0,
                              schedule[0].Category.length - 1
                            );

                      var organisationCheck = JSON.parse(
                        JSON.stringify(organisation)
                      );
                      console.log("organisation check here", organisationCheck);
                      for (let val in organisationCheck) {
                        console.log("category check here", category);
                        if (val.includes(category)) {
                          const equivalent = !!organisationCheck[val]
                            ? organisationCheck[val]
                            : 1;
                          console.log("equivalent here", equivalent);

                          const pricing = quantity * equivalent;
                          MODEL.collectorModel.updateOne(
                            { email: recycler.email },
                            { last_logged_in: new Date() },
                            (res) => {
                              console.log("Logged date updated", new Date());
                            }
                          );
                          var dataToSave = {
                            weight: quantity,

                            coin: pricing,

                            cardID: result._id,

                            scheduleId: schedule[0]._id,

                            completedBy: collectorID,

                            Category: schedule[0].Category,

                            fullname: result.firstname + " " + result.lastname,

                            recycler: recycler.fullname,

                            aggregatorId: recycler.aggregatorId || " ",

                            organisation: recycler.organisation,

                            organisationID: recycler.approvedBy,
                          };
                          MODEL.transactionModel(dataToSave).save(
                            {},
                            (ERR, RESULT) => {
                              var message = {
                                app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                                contents: {
                                  en: "You have just been credited for your schedule",
                                },
                                include_player_ids: [`${result.onesignal_id}`],
                              };

                              sendNotification(message);

                              // if (ERR)
                              //   return RESPONSE.status(400).jsonp(ERR);
                              MODEL.scheduleModel.updateOne(
                                { _id: schedule[0]._id },
                                {
                                  $set: {
                                    completionStatus: "completed",
                                    collectedBy: collectorID,
                                    quantity: quantity,
                                    completionDate: new Date(),
                                  },
                                },
                                (err, res) => {
                                  if (err)
                                    return RESPONSE.status(400).json(err);
                                  MODEL.userModel.updateOne(
                                    { email: result.email },
                                    {
                                      $set: {
                                        availablePoints:
                                          result.availablePoints + pricing,
                                        schedulePoints:
                                          result.schedulePoints + 1,
                                      },
                                    },
                                    (err, res) => {
                                      console.log("update user", err, res);
                                    }
                                  );
                                  MODEL.collectorModel.updateOne(
                                    { _id: collectorID },
                                    {
                                      $set: {
                                        totalCollected:
                                          recycler.totalCollected +
                                          Number(quantity),
                                        numberOfTripsCompleted:
                                          recycler.numberOfTripsCompleted + 1,
                                        busy: false,
                                      },
                                    },
                                    (err, res) => {
                                      console.log("update", err, res);
                                    }
                                  );
                                  return RESPONSE.status(200).json({
                                    message:
                                      "Transaction Completed Successfully",
                                  });
                                }
                              );
                            }
                          );
                          break;
                        }
                      }
                    });
                });
            }
          });
      });
    });
  } catch (err) {
    return RESPONSE.status(500).json(err);
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
          return res.jsonp(response.body.content.data.reverse().slice(0, 5));
        }
      );
    }
  );
};

scheduleController.allWeight = (req, res) => {
  try {
    MODEL.transactionModel
      .find({})
      .sort({ _id: -1 })
      .then((schedules) => {
        var test = JSON.parse(JSON.stringify(schedules));
        let weight = test
          .map((x) => x.weight)
          .reduce((acc, curr) => {
            return acc + curr;
          }, 0);
        res.jsonp(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, weight)
        );
      })
      .catch((err) => res.status(400).jsonp(COMMON_FUN.sendError(err)));
  } catch (err) {
    return res.status(500).json(err);
  }
};

scheduleController.allCoins = (req, res) => {
  // request(
  //   {
  //     url: 'https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent',
  //     method: 'POST',
  //     json: true,
  //     body: {
  //       data: { username: 'xrubicon', password: 'xrubicon1234' },
  //     },
  //   },
  //   function (error, response, body) {
  //     response.headers.token;

  //     request(
  //       {
  //         url:
  //           'https://apis.touchandpay.me/lawma-backend/v1/agent/get/agent/transactions',
  //         method: 'GET',
  //         headers: {
  //           Accept: 'application/json',
  //           'Accept-Charset': 'utf-8',
  //           Token: response.headers.token,
  //         },
  //         json: true,
  //       },
  //       function (error, response, body) {
  //         if (error) return res.status(400).jsonp(error);
  //         var rubicon = JSON.parse(JSON.stringify(response.body.content.data));
  //         var needed = rubicon.filter((x) => x.deviceID == 'xrubicon') || [];
  //         if (!needed) {
  //           return RESPONSE.status(400).json({
  //             message: 'No coin data',
  //           });
  //         }

  //         const test = JSON.parse(JSON.stringify(needed));

  //         const allCoins = test
  //           .map((x) => x.point)
  //           .reduce((acc, curr) => {
  //             return acc + curr;
  //           }, 0);

  //         return res
  //           .status(200)
  //           .jsonp(
  //             COMMON_FUN.sendSuccess(
  //               CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
  //               allCoins
  //             )
  //           );
  //       }
  //     );
  //   }
  // );
  // try {
  //   MODEL.transactionModel.find({}).then((transactions) => {
  //     var coins = transactions
  //       .map((x) => x.coin)
  //       .reduce((acc, curr) => acc + curr, 0);

  //     return res
  //       .status(200)
  //       .json(
  //         COMMON_FUN.sendSuccess(
  //           CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
  //           coins.toFixed(2)
  //         )
  //       );
  //   });
  // }
  var year = new Date().getFullYear();
  try {
    MODEL.transactionModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: "$createdAt" }, year] },
            { $eq: [{ $month: "$createdAt" }, 1] },
          ],
        },
      })
      .sort({
        _id: -1,
      })
      .then((jan) => {
        MODEL.transactionModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: "$createdAt" }, year] },
                { $eq: [{ $month: "$createdAt" }, 2] },
              ],
            },
          })
          .sort({
            _id: -1,
          })
          .then((feb) => {
            MODEL.transactionModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createdAt" }, year] },
                    { $eq: [{ $month: "$createdAt" }, 3] },
                  ],
                },
              })
              .sort({
                _id: -1,
              })
              .then((march) => {
                MODEL.transactionModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: "$createdAt" }, year] },
                        { $eq: [{ $month: "$createdAt" }, 4] },
                      ],
                    },
                  })
                  .sort({
                    _id: -1,
                  })
                  .then((april) => {
                    MODEL.transactionModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: "$createdAt" }, year] },
                            { $eq: [{ $month: "$createdAt" }, 5] },
                          ],
                        },
                      })
                      .sort({
                        _id: -1,
                      })
                      .then((may) => {
                        MODEL.transactionModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: "$createdAt" }, year] },
                                { $eq: [{ $month: "$createdAt" }, 6] },
                              ],
                            },
                          })
                          .sort({
                            _id: -1,
                          })
                          .then((june) => {
                            MODEL.transactionModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: "$createdAt" }, year] },
                                    { $eq: [{ $month: "$createdAt" }, 7] },
                                  ],
                                },
                              })
                              .sort({
                                _id: -1,
                              })
                              .then((july) => {
                                MODEL.transactionModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: "$createdAt" }, year],
                                        },
                                        { $eq: [{ $month: "$createdAt" }, 8] },
                                      ],
                                    },
                                  })
                                  .sort({
                                    _id: -1,
                                  })
                                  .then((Aug) => {
                                    MODEL.transactionModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: "$createdAt" },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: "$createdAt" },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .sort({
                                        _id: -1,
                                      })
                                      .then((sept) => {
                                        MODEL.transactionModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: "$createdAt" },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: "$createdAt" },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .sort({
                                            _id: -1,
                                          })
                                          .then((Oct) => {
                                            MODEL.transactionModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: "$createdAt" },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: "$createdAt",
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .sort({
                                                _id: -1,
                                              })
                                              .then((Nov) => {
                                                MODEL.transactionModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                "$createdAt",
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                "$createdAt",
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .sort({
                                                    _id: -1,
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.transactionModel
                                                      .find({})
                                                      .then((Analytics) => {
                                                        return res
                                                          .status(200)
                                                          .json({
                                                            JANUARY: {
                                                              amount: jan
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            FEBRUARY: {
                                                              amount: feb
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            MARCH: {
                                                              amount: march
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            APRIL: {
                                                              amount: april
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            MAY: {
                                                              amount: may
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            JUNE: {
                                                              amount: june
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            JULY: {
                                                              amount: july
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            AUGUST: {
                                                              amount: Aug.map(
                                                                (x) => x.coin
                                                              ).reduce(
                                                                (acc, curr) =>
                                                                  acc + curr,
                                                                0
                                                              ),
                                                            },
                                                            SEPTEMBER: {
                                                              amount: sept
                                                                .map(
                                                                  (x) => x.coin
                                                                )
                                                                .reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                            OCTOBER: {
                                                              amount: Oct.map(
                                                                (x) => x.coin
                                                              ).reduce(
                                                                (acc, curr) =>
                                                                  acc + curr,
                                                                0
                                                              ),
                                                            },
                                                            NOVEMBER: {
                                                              amount: Nov.map(
                                                                (x) => x.coin
                                                              ).reduce(
                                                                (acc, curr) =>
                                                                  acc + curr,
                                                                0
                                                              ),
                                                            },
                                                            DECEMBER: {
                                                              amount: Dec.map(
                                                                (x) => x.coin
                                                              ).reduce(
                                                                (acc, curr) =>
                                                                  acc + curr,
                                                                0
                                                              ),
                                                            },
                                                            ALL: {
                                                              amount:
                                                                Analytics.map(
                                                                  (x) => x.coin
                                                                ).reduce(
                                                                  (acc, curr) =>
                                                                    acc + curr,
                                                                  0
                                                                ),
                                                            },
                                                          });
                                                      });
                                                  });
                                              });
                                          });
                                      });
                                  });
                              });
                          });
                      });
                  });
              });
          });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

scheduleController.allAccepted = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ collectorStatus: "accept" })

    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.userComplete = (req, resp) => {
  var scheduleID = req.body._id;
  var userID = req.body.userID;
  var rating = req.body.rating;
  var comment = req.body.comment;

  try {
    MODEL.scheduleModel.find({ _id: scheduleID }).then((schedule) => {
      MODEL.userModel.findOne({ _id: userID }).then((result) => {
        MODEL.scheduleModel.updateOne(
          { _id: scheduleID },
          {
            $set: {
              completionStatus: "completed",
              rating: rating,
              comment: comment,
            },
          },
          (err, res) => {
            if (err) return resp.status(400).jsonp(response.body.error);
            MODEL.userModel.updateOne(
              { email: result.email },
              { last_logged_in: new Date() },
              (res) => {
                console.log("Logged date updated", new Date());
              }
            );
            return resp
              .status(200)
              .jsonp({ message: "Your schedule update was successful" });
          }
        );
      });
    });
  } catch (err) {
    return resp.status(404), jsonp(err);
  }
};

scheduleController.userDelete = async (req, resp) => {
  const scheduleID = req.body._id;
  //var userID = req.body.userID;
  const { user } = req;
  console.log("auth", user);

  try {
    const remove = await MODEL.scheduleModel.findOneAndDelete({
      _id: new mongo.ObjectId(scheduleID),
      client: user.email,
    });
    console.log("deleted remove", remove);
    return resp.status(200).jsonp({
      statusCode: 200,
      message: "Your schedule delete was successful",
    });
    // MODEL.scheduleModel.find({ _id: scheduleID }).then((schedule) => {
    //   MODEL.userModel.find({ _id: userID }).then((result) => {
    //     MODEL.scheduleModel.deleteOne({ _id: scheduleID }, (err, res) => {
    //       if (err) return resp.status(400).jsonp(response.body.error);
    //       return resp
    //         .status(200)
    //         .jsonp({ message: "Your schedule delete was successful" });
    //     });
    //   });
    // });
  } catch (err) {
    console.log("err", err);
    return resp.status(404).jsonp(err);
  }
};

scheduleController.userCancel = (req, resp) => {
  var scheduleID = req.body._id;
  var userID = req.body.userID;
  var reason = req.body.reason;

  try {
    MODEL.scheduleModel.findOne({ _id: scheduleID }).then((schedule) => {
      if (!!!schedule) {
        MODEL.scheduleDropModel.findOne({ _id: scheduleID }).then((drop) => {
          MODEL.scheduleDropModel.updateOne(
            {
              _id: scheduleID,
            },
            {
              $set: {
                completionStatus: "cancelled",
                cancelReason: reason,
              },
            },
            (err, response) => {
              if (err) return resp.status(400).jsonp(response.body.error);
              return resp.status(200).json({
                message: "Your schedule drop cancellation was successful",
              });
            }
          );
        });
      } else {
        MODEL.userModel.findOne({ _id: userID }).then((result) => {
          MODEL.scheduleModel.updateOne(
            { _id: scheduleID },
            { $set: { completionStatus: "cancelled", cancelReason: reason } },
            (err, res) => {
              if (err) return resp.status(400).jsonp(response.body.error);
              MODEL.userModel.updateOne(
                { email: result.email },
                { last_logged_in: new Date() },
                (res) => {
                  console.log("Logged date updated", new Date());
                }
              );
              return resp.status(200).jsonp({
                message: "Your schedule cancellation was successful",
              });
            }
          );
        });
      }
    });
  } catch (err) {
    return resp.status(404), jsonp(err);
  }
};

scheduleController.allDeclined = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ collectorStatus: "decline" })

    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleController.smartRoute = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.collectorID;

  var need = [];
  var count = 0;
  var geofencedSchedules = [];
  const active_today = new Date();
  active_today.setHours(0);
  active_today.setMinutes(0);
  var tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 7);

  MODEL.collectorModel.findOne({ _id: collectorID }).then((collector) => {
    var accessArea = collector.areaOfAccess;
    console.log("accessArea", accessArea);
    MODEL.scheduleModel
      .find({
        $and: [
          {
            pickUpDate: {
              $gte: active_today,
            },
            pickUpDate: {
              $lt: tomorrow,
            },
            completionStatus: "pending",
            //collectorStatus: "accept",
          },
        ],
      })
      .sort({ _id: -1 })
      .then((schedules) => {
        //console.log("schedules", schedules);
        schedules.forEach((schedule, index) => {
          var test = schedule.address.split(", ");
          console.log("test value", test);
          (function route() {
            for (let i = 0; i < accessArea.length; i++) {
              if (schedule.lcd === accessArea[i]) {
                need.push(schedule["lcd"]);
                geofencedSchedules.push(schedule);
                count++;
              }
              for (let j = 0; j < test.length; j++) {
                if (test[j].includes(accessArea[i])) {
                  need.push(test[j]);
                  geofencedSchedules.push(schedule);
                  count++;
                }
              }
            }
            return !!need;
          })();
        });
        var geoSchedules = geofencedSchedules.filter(
          (x) =>
            (x.completionStatus !== "completed" &&
              x.completionStatus !== "cancelled" &&
              x.completionStatus !== "missed") ||
            (x.completionStatus == "pending" && x.collectorStatus == "accept")
        );
        const referenceSchedules = [...new Set(geoSchedules)];
        RESPONSE.jsonp(
          COMMON_FUN.sendSuccess(
            CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
            referenceSchedules
          )
        );
      })
      .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
  });
};

scheduleController.afterCompletion = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.collectorID;

  MODEL.collectorModel.findOne({ _id: collectorID }).then((collector) => {
    if (!collector) {
      return RESPONSE.status(400).json({ message: "Not a valid collector ID" });
    }

    MODEL.scheduleModel
      .find({ collectedBy: collectorID, completionStatus: "pending" })
      .then((result, err) => {
        if (err) return RESPONSE.status(400).json(err);

        return RESPONSE.status(200).json(result);
      });
  });
};

scheduleController.collectorMissed = (req, res) => {
  const scheduleID = req.body.scheduleID;
  const collectorID = req.body.collectorID;

  try {
    MODEL.scheduleModel.findOne({ _id: scheduleID }).then((result) => {
      if (!result)
        return res.status(400).json({
          message: "This schedule is invalid",
        });

      if (result.collectedBy !== collectorID)
        return res.status(400).json({
          message: "You didn't accept this schedule",
        });

      MODEL.scheduleModel
        .updateOne(
          { _id: result._id },
          { $set: { completionStatus: "missed" } }
        )
        .then((resp, err) => {
          MODEL.userModel
            .findOne({ email: result.client })
            .then((result, err) => {
              var message = {
                app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                contents: {
                  en: "A collector just missed your schedule. Kindly reschedule this pickup",
                },
                include_player_ids: [`${result.onesignal_id}`],
              };

              sendNotification(message);
            });
          return res.status(200).json({
            message: "You missed this schedule",
          });
        });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

scheduleController.getScheduleCollector = (req, res) => {
  const recyclerID = req.query.recyclerID;
  var PROJECTION = {
    recycler: 0,
    organisationID: 0,
    completedBy: 0,
    password: 0,
    _id: 0,
    password: 0,
    dateOfBirth: 0,
    localGovernment: 0,
    place: 0,
    state: 0,
    approvedBy: 0,
    areaOfAccess: 0,
    address: 0,
    createdAt: 0,
    __v: 0,
    countryCode: 0,
  };

  if (!recyclerID) {
    return res.status(400).json({
      message: "You need a valid recycler ID",
    });
  }

  MODEL.collectorModel
    .findOne({ _id: recyclerID }, PROJECTION)
    .then((result) => {
      if (!result) {
        return res.status(400).json({
          message: "No recycler data available",
        });
      }
      return res.status(200).json(result);
    });
};

module.exports = scheduleController;
