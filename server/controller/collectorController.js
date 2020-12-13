'use strict';

/**************************************************
 ***** User controller for user business logic ****
 **************************************************/
let collectorController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
let FS = require('fs');
const { Response } = require('aws-sdk');
var request = require('request');
const userController = require('./userController');

collectorController.registerCollector = (REQUEST, RESPONSE) => {
  var need = {};
  let dataToSave = { ...REQUEST.body };

  COMMON_FUN.encryptPswrd(dataToSave.password, (ERR, PASSWORD) => {
    if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    else {
      dataToSave.password = PASSWORD;
      var errors = {};
      MODEL.collectorModel
        .findOne({
          $or: [
            {
              email: dataToSave.email,
            },
            {
              phone: dataToSave.phone,
            },
          ],
        })
        .then((user) => {
          if (user) {
            errors.message = 'User already exists';
            RESPONSE.status(400).jsonp(errors);
          } else {
            MODEL.collectorModel(dataToSave).save({}, (ERR, RESULT) => {
              if (ERR) RESPONSE.status(400).jsonp(ERR);
              else {
                var data = {
                  api_key:
                    'TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63',
                  message_type: 'NUMERIC',
                  to: `+234${RESULT.phone}`,
                  from: 'N-Alert',
                  channel: 'dnd',
                  pin_attempts: 10,
                  pin_time_to_live: 5,
                  pin_length: 4,
                  pin_placeholder: '< 1234 >',
                  message_text:
                    'Your Pakam Verification code is < 1234 >. It expires in 5 minutes',
                  pin_type: 'NUMERIC',
                };
                var options = {
                  method: 'POST',
                  url: 'https://termii.com/api/sms/otp/send',
                  headers: {
                    'Content-Type': ['application/json', 'application/json'],
                  },
                  body: JSON.stringify(data),
                };
                request(options, function (error, response) {
                  if (error) {
                    throw new Error(error);
                  } else {
                    let UserData = {
                      email: RESULT.email,
                      phone: RESULT.phone,
                      username: RESULT.username,
                      roles: RESULT.roles,
                    };
                    return RESPONSE.status(200).jsonp(
                      COMMON_FUN.sendSuccess(
                        CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                        UserData
                      )
                    );
                  }
                });
              }
            });
          }
        });
    }
  });
};

// console.log("verification in progress");
// MODEL.collectorModel.updateOne(
//   { email: RESULT.email },
//   { $set: { mobile_carrier: phone_number.carrier.name
//   } },
//   (res) => {
//     console.log(res);
//   }
// )

collectorController.loginCollector = (REQUEST, RESPONSE) => {
  let CRITERIA = {
      $or: [{ username: REQUEST.body.username }, { email: REQUEST.body.email }],
    },
    PROJECTION = { __v: 0, createAt: 0 };

  /** find user is exists or not */
  MODEL.collectorModel
    .findOne({ phone: REQUEST.body.phone }, PROJECTION, { lean: true })
    .then((USER) => {
      USER /** matching password */
        ? COMMON_FUN.decryptPswrd(
            REQUEST.body.password,
            USER.password,
            (ERR, MATCHED) => {
              if (ERR)
                return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
              else if (!MATCHED)
                return RESPONSE.status(400).jsonp(
                  COMMON_FUN.sendSuccess(
                    CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD
                  )
                );
              else {
                var jwtToken = COMMON_FUN.createToken(
                  USER
                ); /** creating jwt token */

                MODEL.collectorModel.updateOne(
                  { phone: REQUEST.body.phone },
                  { last_logged_in: new Date() },
                  (res) => {
                    console.log('Logged date updated', new Date());
                  }
                );

                USER.token = jwtToken;
                return RESPONSE.jsonp(USER);
              }
            }
          )
        : RESPONSE.status(400).jsonp({
            message: ' Invalid phone number',
          });
    })
    .catch((err) => {
      return RESPONSE.status(500).jsonp(COMMON_FUN.sendError(err));
    });
};

collectorController.checkAccepted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;
  MODEL.scheduleModel
    .find({ collectorStatus: 'accept', collectedBy: collectorID })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkTotalAccepted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;
  MODEL.scheduleModel
    .find({ collectorStatus: 'accept', collectedBy: collectorID })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(
          CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
          schedules.length
        )
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkCompleted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;

  MODEL.scheduleModel
    .find({ completionStatus: 'completed', collectedBy: collectorID })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.collectorAnalysis = (REQUEST, RESPONSE) => {
  var completed;
  var missed;
  var transactions;
  var accepted;

  const collectorID = REQUEST.query.ID;

  MODEL.userModel.updateOne(
    { _id: REQUEST.query.ID },
    { last_logged_in: new Date() },
    (res) => {
      console.log('Logged date updated', new Date());
    }
  );

  MODEL.scheduleModel
    .find({ completionStatus: 'completed', collectedBy: collectorID })
    .sort({ _id: -1 })
    .then((schedules) => {
      completed = schedules.length;
      MODEL.scheduleModel
        .find({ completionStatus: 'missed', collectedBy: collectorID })
        .then((schedules) => {
          missed = schedules.length;
          MODEL.transactionModel
            .find({ completedBy: collectorID })
            .then((transaction) => {
              transactions = transaction.length;

              // res.status(200).jsonp(transaction)
              MODEL.scheduleModel
                .find({ collectorStatus: 'accept', collectedBy: collectorID })
                .then((schedules) => {
                  accepted = schedules.length;
                  RESPONSE.status(200).jsonp(
                    COMMON_FUN.sendSuccess(
                      CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                      {
                        completed: completed,
                        transactions: transactions,
                        accepted: accepted,
                        missed: missed,
                      }
                    )
                  );
                })
                .catch((err) =>
                  RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err))
                );
            })
            .catch((err) => res.status(500).jsonp(err));

          // RESPONSE.status(200).jsonp(
          //   COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
          // );
        })
        .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));

      // RESPONSE.status(200).jsonp(
      //   COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules.length)
      // );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkTotalCompleted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;

  MODEL.scheduleModel
    .find({ completionStatus: 'completed', collectedBy: collectorID })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(
          CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
          schedules.length
        )
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkMissed = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;

  MODEL.scheduleModel
    .find({ completionStatus: 'missed', collectedBy: collectorID })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkTotalMissed = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;

  MODEL.scheduleModel
    .find({ completionStatus: 'missed', collectedBy: collectorID })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(
          CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
          schedules.length
        )
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};
// collectorController.checkAccepted = (REQUEST, RESPONSE) => {
//   MODEL.scheduleModel
//     .find({ completionStatus: "missed", client: REQUEST.body.client })
//     .then((schedules) => {
//       RESPONSE.status(200).jsonp(
//         COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
//       );
//     })
//     .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
// };

collectorController.updateCollector = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let checkUserExist = await MODEL.collectorModel.findOne(
      { email: REQUEST.body.email },
      {},
      { lean: true }
    );

    if (checkUserExist) {
      MODEL.collectorModel
        .updateOne(
          { email: REQUEST.body.email },
          {
            $set: {
              phone: REQUEST.body.phone,
              gender: REQUEST.body.gender,
              dateOfBirth: REQUEST.body.dateOfBirth,
              address: REQUEST.body.address,
              fullname: REQUEST.body.fullname,
              state: REQUEST.body.state,
              place: REQUEST.body.place,
              organisation: REQUEST.body.organisation,
              localGovernment: REQUEST.body.localGovernment,
              profile_picture: REQUEST.body.profile_picture,
            },
          }
        )
        .then((SUCCESS) => {
          MODEL.collectorModel
            .findOne({ email: REQUEST.body.email })
            .then((user) => {
              if (!user) {
                return RESPONSE.status(400).json({
                  message: 'User not found',
                });
              }

              MODEL.organisationModel
                .findOne({ companyName: REQUEST.body.organisation })
                .then((organisation) => {
                  console.log(organisation);

                  console.log('--->', user);

                  MODEL.collectorModel.updateOne(
                    { email: user.email },
                    { $set: { areaOfAccess: organisation.areaOfAccess } },
                    (res) => {
                      console.log(res);
                      MODEL.collectorModel
                        .findOne({
                          email: user.email,
                        })
                        .then((recycler) => {
                          return RESPONSE.status(200).json(recycler);
                        });
                    }
                  );
                });
            })
            .catch((err) => RESPONSE.status(500).json(err));
        })
        .catch((ERR) => {
          return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
        });
    } else {
      return RESPONSE.status(400).jsonp(
        COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
      );
    }
  } catch (ERR) {
    return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
  }
};

collectorController.verifyPhone = (REQUEST, RESPONSE) => {
  var error = {};
  var phone = REQUEST.body.phone;
  var token = REQUEST.body.token;
  var pin_id = REQUEST.body.pin_id;

  var data = {
    api_key: 'TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63',
    pin_id: pin_id,
    pin: token,
  };
  var options = {
    method: 'POST',
    url: 'https://termii.com/api/sms/otp/verify',
    headers: {
      'Content-Type': ['application/json', 'application/json'],
    },
    body: JSON.stringify(data),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);

    if (response.body.verified === true) {
      MODEL.collectorModel.updateOne(
        { phone: phone },
        { verified: true },
        (res) => {
          MODEL.collectorModel.findOne({ phone: phone }, (err, USER) => {
            var test = JSON.parse(JSON.stringify(USER));

            if (err) return RESPONSE.status(400).jsonp(error);
            console.log('user here at all', USER);
            var jwtToken = COMMON_FUN.createToken(
              test
            ); /** creating jwt token */
            console.log('user token here at all', USER);
            test.token = jwtToken;
            return RESPONSE.jsonp(test);
          });
        }
      );
    }
    console.log(response.body);
  });
};
// TWILIO IMPLEMENTATION

// client.verify
//   .services("VAeaa492de9598c3dcce55fd9243461ab3")
//   .verificationChecks.create({
//     to: `+234${phone}`,
//     code: `${token}`,
//   })
//   .then((verification_check) => {
//     if (verification_check.status == "approved") {
//       console.log(verification_check.status);
//       MODEL.collectorModel.updateOne(
//         { phone: phone },
//         { verified: true },
//         (res) => {

//           MODEL.collectorModel
//             .findOne({ "phone": phone }, (err,USER) => {

//               var test = JSON.parse(JSON.stringify(USER))

//               if (err) return RESPONSE.status(400).jsonp(error)
//               console.log("user here at all", USER)
//               var jwtToken = COMMON_FUN.createToken(
//                 test
//               ); /** creating jwt token */
//               console.log("user token here at all", USER)
//               test.token = jwtToken;
//               return RESPONSE.jsonp(test);

//             })
//         }
//       );
//     }
//   })

collectorController.resendVerification = (REQUEST, RESPONSE) => {
  var error = {};
  var phone = REQUEST.body.phone;

  const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  const client = require('twilio')(accountSid, authToken);

  try {
    var data = {
      api_key: 'TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63',
      message_type: 'NUMERIC',
      to: `+234${phone}`,
      from: 'N-Alert',
      channel: 'dnd',
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 4,
      pin_placeholder: '< 1234 >',
      message_text:
        'Your Pakam Verification code is < 1234 >. It expires in 5 minutes',
      pin_type: 'NUMERIC',
    };
    var options = {
      method: 'POST',
      url: 'https://termii.com/api/sms/otp/send',
      headers: {
        'Content-Type': ['application/json', 'application/json'],
      },
      body: JSON.stringify(data),
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);

      return RESPONSE.status(200).json(JSON.parse(response.body));
    });

    // client.verify
    //   .services("VAeaa492de9598c3dcce55fd9243461ab3")
    //   .verifications.create({
    //     to: `+234${phone}`,
    //     channel: "sms",
    //   })
    //   .then((verification) => {
    //     console.log(verification.status);
    //     RESPONSE.status(200).jsonp({ message: "Verification code sent" });
    //   })
    //   .catch((err) => RESPONSE.status(404).jsonp(err));
  } catch (err) {
    return RESPONSE.status(400).jsonp(err);
  }
};

collectorController.getTransactions = (req, res) => {
  const collectorID = req.query.ID;

  MODEL.transactionModel
    .find({ completedBy: collectorID })
    .sort({ _id: -1 })
    .then((transaction) => res.status(200).jsonp(transaction))
    .catch((err) => res.status(500).jsonp(err));
};

collectorController.updatePosition = (req, resp) => {
  const userID = req.body.userID;
  const lat = req.body.lat;
  const long = req.body.long;
  try {
    MODEL.collectorModel.updateOne(
      { _id: userID },
      { $set: { lat: lat, long: long } },
      (res) => {
        return resp.status(200).json({
          message: 'Position Updated Successfully',
        });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};

collectorController.updatePhoneSpecifications = async (REQUEST, RESPONSE) => {
  try {
    let checkUserExist = await MODEL.collectorModel.findOne(
      { email: REQUEST.body.email },
      {},
      { lean: true }
    );
    MODEL.userModel.updateOne(
      { email: REQUEST.body.email },
      { last_logged_in: new Date() },
      (res) => {
        console.log('Logged date updated', new Date());
      }
    );

    if (checkUserExist) {
      MODEL.collectorModel
        .updateOne(
          { email: REQUEST.body.email },
          {
            $set: {
              phone_type: REQUEST.body.phone_type,
              phone_OS: REQUEST.body.phone_OS,
              internet_provider: REQUEST.body.internet_provider,
            },
          }
        )
        .then((SUCCESS) => {
          MODEL.collectorModel
            .findOne({ email: REQUEST.body.email })
            .then((user) => {
              if (!user) {
                return RESPONSE.status(400).json({
                  message: 'User not found',
                });
              }
              return RESPONSE.jsonp(
                COMMON_FUN.sendSuccess(
                  CONSTANTS.STATUS_MSG.SUCCESS.UPDATED,
                  user
                )
              );
            })
            .catch((err) => RESPONSE.status(500).json(err));
        })
        .catch((ERR) => {
          return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
        });
    } else {
      return RESPONSE.status(400).jsonp(
        COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
      );
    }
  } catch (ERR) {
    return RESPONSE.status(500).jsonp(COMMON_FUN.sendError(ERR));
  }
};

collectorController.deleteRecycler = (req, res) => {
  const userID = req.body.userID;
  try {
    MODEL.collectorModel
      .deleteOne({
        _id: userID,
      })
      .then((result) => {
        return res.status(200).json({
          message: 'User deleted successfully',
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

collectorController.collectorAnalytics = (req, res) => {
  const today = new Date();
  const active_today = new Date();

  try {
    MODEL.collectorModel.find({}).then((allUser) => {
      active_today.setDate(today.getDate() - 1);
      MODEL.collectorModel
        .find({
          createdAt: {
            $gte: active_today,
          },
        })
        .sort({ _id: -1 })
        .then((newUser) => {
          MODEL.collectorModel
            .find({
              last_logged_in: {
                $gte: active_today,
              },
            })
            .sort({ _id: -1 })
            .then((activeTodayUser) => {
              return res.status(200).json({
                allUsers: allUser.length,
                newUsers: newUser.length,
                activeTodayUsers: activeTodayUser.length,
                inactiveUsers: allUser.length - activeTodayUser.length,
              });
            });
        });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

collectorController.monthFiltering = (req, res) => {
  var year = new Date().getFullYear();

  try {
    MODEL.collectorModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.collectorModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.collectorModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.collectorModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.collectorModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.collectorModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.collectorModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.collectorModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        {
                                          $eq: [{ $year: '$createdAt' }, year],
                                        },
                                        { $eq: [{ $month: '$createdAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.collectorModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createdAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [
                                                { $month: '$createdAt' },
                                                9,
                                              ],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.collectorModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createdAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createdAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.collectorModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createdAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        {
                                                          $month: '$createdAt',
                                                        },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.collectorModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createdAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createdAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.collectorModel
                                                      .find({
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    '$createdAt',
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    '$createdAt',
                                                                },
                                                                11,
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      })
                                                      .then((Analytics) => {
                                                        res.status(200).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            data: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            data: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            data: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            data: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            data: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            data: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            data: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            data: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            data: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            data: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            data: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            data: Dec,
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

var ObjectID = require('mongodb').ObjectID;

collectorController.triggerActivity = (req, res) => {
  const userID = req.body.userID;
  var today = new Date();

  console.log('>>RESPONSE', req);

  try {
    MODEL.collectorModel.updateOne(
      { _id: ObjectID(userID) },
      { $set: { last_logged_in: today } },
      (err, resp) => {
        console.log('<<<', resp);
        return res.status(200).json({
          message: 'Activity',
        });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};

collectorController.collectorActivityAnalytics = (req, res) => {
  const today = new Date();
  const active_today = new Date();

  try {
    MODEL.collectorModel.find({}).then((allUser) => {
      active_today.setDate(today.getDate() - 1);
      MODEL.collectorModel
        .find({
          createdAt: {
            $gte: active_today,
          },
        })
        .sort({ _id: -1 })
        .then((newUser) => {
          MODEL.collectorModel
            .find({
              last_logged_in: {
                $gte: active_today,
              },
            })
            .sort({ _id: -1 })
            .then((activeTodayUser) => {
              MODEL.collectorModel
                .find({
                  $or: [
                    { last_logged_in: { $exists: false } },
                    {
                      last_logged_in: {
                        $lte: active_today,
                      },
                    },
                  ],
                })
                .sort({ _id: -1 })
                .then((inactiveCollectors) => {
                  return res.status(200).json({
                    allCollectors: {
                      amount: allUser.length,
                      allcollectors: allUser,
                    },
                    newCollectors: {
                      amount: newUser.length,
                      newCollectors: newUser,
                    },
                    activeTodayCollectors: {
                      amount: activeTodayUser.length,
                      activeTodayCollectors: activeTodayUser,
                    },
                    inactive: {
                      amount: inactiveCollectors.length,
                      inactiveCollectors: inactiveCollectors,
                    },
                  });
                });
            });
        });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = collectorController;
