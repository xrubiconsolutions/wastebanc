"use strict";

let scheduleDropController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");
const moment = require("moment-timezone");
const { sendNotification } = require("../util/commonFunction");

moment().tz("Africa/Lagos", false);

const { validationResult, body } = require("express-validator");
var request = require("request");

const OneSignal = require("onesignal-node");

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
};

// var sendNotification = function (data) {
//   var headers = {
//     "Content-Type": "application/json; charset=utf-8",
//   };

//   var options = {
//     host: "onesignal.com",
//     port: 443,
//     path: "/api/v1/notifications",
//     method: "POST",
//     headers: headers,
//   };

//   var https = require("https");
//   var req = https.request(options, function (res) {
//     res.on("data", function (data) {
//       console.log(JSON.parse(data));
//     });
//   });

//   req.on("error", function (e) {
//     console.log(e);
//   });

//   req.write(JSON.stringify(data));
//   req.end();
// };
scheduleDropController.schedule = (REQUEST, RESPONSE) => {
  //bodyValidate(REQUEST, RESPONSE)
  var data = { ...REQUEST.body };

  if (moment(data.dropOffDate) < moment()) {
    return RESPONSE.status(400).json({
      statusCode: 400,
      customMessage: "Invalid date",
    });
  }
  MODEL.userModel.findOne({ email: REQUEST.body.client }).then((result) => {
    MODEL.userModel.updateOne(
      { email: REQUEST.body.scheduleCreator },
      { last_logged_in: new Date() },
      (res) => {
        console.log("Logged date updated", new Date());
      }
    );
    console.log("result", result);

    const expireDate = moment(data.dropOffDate, "YYYY-MM-DD").add(7, "days");
    data.expiryDuration = expireDate;
    //data.clientId = result._id;

    MODEL.scheduleDropModel(data).save({}, (ERR, RESULT) => {
      try {
        if (ERR) return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));

        return RESPONSE.status(200).json(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, RESULT)
        );
      } catch (err) {
        return RESPONSE.status(400).json(err);
      }
    });
  });
};

scheduleDropController.getPendingSchedule = (REQUEST, RESPONSE) => {
  MODEL.scheduleDropModel
    .find({
      completionStatus: "pending",
    })

    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.getPendingScheduleUser = (REQUEST, RESPONSE) => {
  const phone = REQUEST.query.phone;
  MODEL.scheduleDropModel
    .find({
      completionStatus: "pending",
      phone: phone,
    })

    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.getCompletedScheduleUser = async (REQUEST, RESPONSE) => {
  let { page = 1, resultsPerPage = 3 } = REQUEST.query;
  if (typeof page === "string") page = parseInt(page);
  if (typeof resultsPerPage === "string")
    resultsPerPage = parseInt(resultsPerPage);
  const phone = REQUEST.query.phone;

  try {
    const schedules = await MODEL.scheduleDropModel
      .find({ completionStatus: "completed", phone })
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    const total = await MODEL.scheduleDropModel.countDocuments({
      completionStatus: "completed",
      phone,
    });

    return RESPONSE.status(200).jsonp({
      error: false,
      message: "success",
      data: {
        schedules,
        total,
        page,
        resultsPerPage,
        totalPages: Math.ceil(total / resultsPerPage),
      },
    });
  } catch (error) {
    return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(error));
  }
  MODEL.scheduleDropModel
    .find({
      completionStatus: "completed",
      phone: phone,
    })

    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.getCompletedSchedule = (REQUEST, RESPONSE) => {
  MODEL.scheduleDropModel
    .find({
      completionStatus: "completed",
    })

    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.rewardDropSystem = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.body.collectorID;
  const quantity = REQUEST.body.quantity;
  if (!quantity)
    return RESPONSE.status(400).json({
      message: "Enter a valid input for the quantity",
    });

  try {
    MODEL.scheduleDropModel.find({ _id: REQUEST.body._id }).then((schedule) => {
      if (!schedule[0])
        return RESPONSE.status(400).json({
          message: "This schedule is invalid",
        });
      MODEL.userModel
        .findOne({ email: schedule[0].scheduleCreator })
        .then((result) => {
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
                        for (let val in organisationCheck) {
                          if (val.includes(category)) {
                            const equivalent = !!organisationCheck[val]
                              ? organisationCheck[val]
                              : 1;
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

                              fullname:
                                result.firstname + " " + result.lastname,

                              recycler: recycler.fullname,

                              aggregatorId: recycler.aggregatorId || " ",

                              organisation: recycler.organisation,

                              organisationID: recycler.approvedBy,
                            };
                            MODEL.transactionModel(dataToSave).save(
                              {},
                              (ERR, RESULT) => {
                                var message = {
                                  app_id:
                                    "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                                  contents: {
                                    en: "Your schedule drop off has been completed successfully. You have received the equivalent amount in your wallet",
                                  },
                                  include_player_ids: [
                                    `${result.onesignal_id}`,
                                  ],
                                };

                                sendNotification(message);

                                // if (ERR)
                                //   return RESPONSE.status(400).jsonp(ERR);
                                MODEL.scheduleDropModel.updateOne(
                                  { _id: schedule[0]._id },
                                  {
                                    $set: {
                                      completionStatus: "completed",
                                      collectedBy: collectorID,
                                      quantity: quantity,
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

scheduleDropController.dropRequestRecycler = async (req, res) => {
  const organisationId = req.user.organisationId;
  try {
    const dropoffs = await MODEL.scheduleDropModel.find({
      organisationCollection: organisationId,
      completionStatus: "pending",
    });
    return res
      .status(200)
      .json({ error: false, message: "success", data: dropoffs });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

scheduleDropController.getScheduleDropCompletedRecycler = (req, res) => {
  const recyclerId = req.query.recyclerId;
  try {
    MODEL.scheduleDropModel
      .find({
        completionStatus: "completed",
        collectedBy: recyclerId,
      })
      .sort({
        _id: -1,
      })

      .then((drop) => {
        return res.status(200).json(drop);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

scheduleDropController.monthlyDropPending = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.scheduleDropModel
      .find({
        completionStatus: "pending",
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
        MODEL.scheduleDropModel
          .find({
            completionStatus: "pending",
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
            MODEL.scheduleDropModel
              .find({
                completionStatus: "pending",
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
                MODEL.scheduleDropModel
                  .find({
                    completionStatus: "pending",
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
                    MODEL.scheduleDropModel
                      .find({
                        completionStatus: "pending",
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
                        MODEL.scheduleDropModel
                          .find({
                            completionStatus: "pending",
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
                            MODEL.scheduleDropModel
                              .find({
                                completionStatus: "pending",
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
                                MODEL.scheduleDropModel
                                  .find({
                                    completionStatus: "pending",
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
                                    MODEL.scheduleDropModel
                                      .find({
                                        completionStatus: "pending",
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
                                        MODEL.scheduleDropModel
                                          .find({
                                            completionStatus: "pending",
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
                                            MODEL.scheduleDropModel
                                              .find({
                                                completionStatus: "pending",
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
                                                MODEL.scheduleDropModel
                                                  .find({
                                                    completionStatus: "pending",
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
                                                    MODEL.scheduleDropModel
                                                      .find({
                                                        completionStatus:
                                                          "pending",
                                                      })
                                                      .then((Analytics) => {
                                                        RESPONSE.status(
                                                          200
                                                        ).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            schedules: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            schedules: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            schedules: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            schedules: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            schedules: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            schedules: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            schedules: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            schedules: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            schedules: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            schedules: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            schedules: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            schedules: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                            schedules:
                                                              Analytics,
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
    return RESPONSE.status(500).json(err);
  }
};

scheduleDropController.monthlyDropCompleted = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();
  try {
    MODEL.scheduleDropModel
      .find({
        completionStatus: "completed",
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
        MODEL.scheduleDropModel
          .find({
            completionStatus: "completed",
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
            MODEL.scheduleDropModel
              .find({
                completionStatus: "completed",
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
                MODEL.scheduleDropModel
                  .find({
                    completionStatus: "completed",
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
                    MODEL.scheduleDropModel
                      .find({
                        completionStatus: "completed",
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
                        MODEL.scheduleDropModel
                          .find({
                            completionStatus: "completed",
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
                            MODEL.scheduleDropModel
                              .find({
                                completionStatus: "completed",
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
                                MODEL.scheduleDropModel
                                  .find({
                                    completionStatus: "completed",
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
                                    MODEL.scheduleDropModel
                                      .find({
                                        completionStatus: "completed",
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
                                        MODEL.scheduleDropModel
                                          .find({
                                            completionStatus: "completed",
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
                                            MODEL.scheduleDropModel
                                              .find({
                                                completionStatus: "completed",
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
                                                MODEL.scheduleDropModel
                                                  .find({
                                                    completionStatus:
                                                      "completed",
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
                                                    MODEL.scheduleDropModel
                                                      .find({
                                                        completionStatus:
                                                          "completed",
                                                      })
                                                      .then((Analytics) => {
                                                        RESPONSE.status(
                                                          200
                                                        ).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            schedules: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            schedules: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            schedules: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            schedules: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            schedules: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            schedules: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            schedules: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            schedules: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            schedules: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            schedules: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            schedules: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            schedules: Dec,
                                                          },
                                                          ALL: {
                                                            amount:
                                                              Analytics.length,
                                                            schedules:
                                                              Analytics,
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
    return RESPONSE.status(500).json(err);
  }
};

module.exports = scheduleDropController;
