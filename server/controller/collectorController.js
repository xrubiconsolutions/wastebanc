"use strict";

/**************************************************
 ***** User controller for user business logic ****
 **************************************************/
let collectorController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");


collectorController.registerCollector = (REQUEST, RESPONSE) => {
  // RESPONSE.jsonp(REQUEST.body);
  var need = {};
  let dataToSave = { ...REQUEST.body };

  COMMON_FUN.encryptPswrd(dataToSave.password, (ERR, PASSWORD) => {
    if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    else {
      dataToSave.password = PASSWORD;
      var errors = {};
      MODEL.collectorModel.findOne({
        
        
       "$or": [{
          "email": dataToSave.email
      }, {
          "fullname": dataToSave.fullname
      }]
        
      }).then((user) => {
        if (user) {
          errors.email = "Email already exists";
          RESPONSE.status(400).jsonp(errors);
        } else {
          MODEL.collectorModel(dataToSave).save({}, (ERR, RESULT) => {
            if (ERR) RESPONSE.status(400).jsonp(ERR);
            else {
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
                  //  return response.headers.token;
                  request(
                    {
                      url:
                        "https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer",
                      method: "POST",
                      headers: {
                        Accept: "application/json",
                        "Accept-Charset": "utf-8",
                        Token: response.headers.token,
                      },
                      json: true,
                      body: {
                        data: {
                          username: RESULT.username,
                          firstname: RESULT.firstname,
                          lastname: RESULT.lastname,
                          othernames: RESULT.othernames,
                          email: RESULT.email,
                          phone: RESULT.phone,
                          address: RESULT.address,
                        },
                      },
                    },
                    function (err, res) {
                      let card_id = res.body.content.data.cardID;
                      need = { cardID: card_id, ...RESULT };

                      const accountSid = "ACa71d7c2a125fe67b309b691e0424bc66";
                      const authToken = "47db7eac4e2e1c56b01de8152d0adc8d";
                      const client = require("twilio")(accountSid, authToken);

                      client.verify
                        .services("VA703183e103532fd4fe69da94ef2c12c1")
                        .verifications.create({
                          to: `+234${dataToSave.phone}`,
                          channel: "sms",
                        })
                        .then((verification) =>
                          console.log(verification.status)
                        );

                      MODEL.collectorModel.updateOne(
                        { email: RESULT.email },
                        { $set: { cardID: card_id } },
                        (res) => {
                          console.log(res);
                        }
                      );
                    }
                  );
                }
              );
              console.log("Card details here", need);

                /*  revamped to setup */

              // MODEL.organisationModel.findOne({companyName: REQUEST.body.organisation}).then(organisation=>{

              //   MODEL.collectorModel.updateOne(
              //     { email: RESULT.email },
              //     { $set: { areaOfAccess : organisation.areaOfAccess } },
              //     (res) => {
              //       console.log(res);
              //     }
              //   );

              // }).catch(err=>RESPONSE.status(500).json(err))

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
};

collectorController.loginCollector = (REQUEST, RESPONSE) => {
  let CRITERIA = {
      $or: [{ username: REQUEST.body.username }, { email: REQUEST.body.email }],
    },
    PROJECTION = { __v: 0, createAt: 0 };

  /** find user is exists or not */
  MODEL.collectorModel
    .findOne({ fullname: REQUEST.body.fullname }, PROJECTION, { lean: true })
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
                USER.token = jwtToken;
                return RESPONSE.jsonp(USER);
              }
            }
          )
        : RESPONSE.status(400).jsonp(
            COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
          );
    })
    .catch((err) => {
      return RESPONSE.status(500).jsonp(COMMON_FUN.sendError(err));
    });
};

collectorController.checkAccepted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID;
  MODEL.scheduleModel
    .find({ collectorStatus: "accept", collectedBy: collectorID })
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
    .find({ collectorStatus: "accept", collectedBy: collectorID })
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
    .find({ completionStatus: "completed", collectedBy: collectorID })
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

  MODEL.scheduleModel
    .find({ completionStatus: "completed", collectedBy: collectorID })
    .then((schedules) => {
      completed = schedules.length;
      MODEL.scheduleModel
        .find({ completionStatus: "missed", collectedBy: collectorID })
        .then((schedules) => {
          missed = schedules.length;
          MODEL.transactionModel
            .find({ completedBy: collectorID })
            .then((transaction) => {
              transactions = transaction.length;

              // res.status(200).jsonp(transaction)
              MODEL.scheduleModel
                .find({ collectorStatus: "accept", collectedBy: collectorID })
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
    .find({ completionStatus: "completed", collectedBy: collectorID })
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
    .find({ completionStatus: "missed", collectedBy: collectorID })
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
    .find({ completionStatus: "missed", collectedBy: collectorID })
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
            },
          }
        )
        .then((SUCCESS) => {
          MODEL.collectorModel.findOne({ email: REQUEST.body.email }).then(user=>{
            if(!user){
              return RESPONSE.status(400).json({
                message: "User not found"
              })
            }

             MODEL.organisationModel.findOne({companyName: REQUEST.body.organisation}).then(organisation=>{

              console.log(organisation)


              console.log("--->",user)

                MODEL.collectorModel.updateOne(
                  { email: user.email },
                  { $set: { areaOfAccess : organisation.areaOfAccess } },
                  (res) => {
                    console.log(res);
                    return RESPONSE.status(200).json({
                      message: "Collector's profile successfully updated"
                    })
        
                  }
                );

              })



          
          }).catch(err=>RESPONSE.status(500).json(err))
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
  var token = REQUEST.body.token;
  var phone = REQUEST.body.phone;

  const accountSid = "ACa71d7c2a125fe67b309b691e0424bc66";
  const authToken = "47db7eac4e2e1c56b01de8152d0adc8d";
  const client = require("twilio")(accountSid, authToken);

  client.verify
    .services("VA703183e103532fd4fe69da94ef2c12c1")
    .verificationChecks.create({
      to: `+234${phone}`,
      code: `${token}`,
    })
    .then((verification_check) => {
      if (verification_check.status == "approved") {
        console.log(verification_check.status);
        MODEL.collectorModel.updateOne(
          { phone: phone },
          { verified: true },
          (res) => {

            MODEL.collectorModel
              .findOne({ "phone": phone }, (err,USER) => {

                var test = JSON.parse(JSON.stringify(USER))

                if (err) return RESPONSE.status(400).jsonp(error)
                console.log("user here at all", USER)
                var jwtToken = COMMON_FUN.createToken(
                  test
                ); /** creating jwt token */
                console.log("user token here at all", USER)
                test.token = jwtToken;
                return RESPONSE.jsonp(test);
                  
              })
          }
        );
      }
    })
    .catch((err) => RESPONSE.status(404).jsonp(err));
};

collectorController.resendVerification = (REQUEST, RESPONSE) => {
  var error = {};
  var phone = REQUEST.body.phone;

  const accountSid = "ACa71d7c2a125fe67b309b691e0424bc66";
  const authToken = "47db7eac4e2e1c56b01de8152d0adc8d";
  const client = require("twilio")(accountSid, authToken);

  try {
    client.verify
      .services("VA703183e103532fd4fe69da94ef2c12c1")
      .verifications.create({
        to: `+234${phone}`,
        channel: "sms",
      })
      .then((verification) => {
        console.log(verification.status);
        RESPONSE.status(200).jsonp({ message: "Verification code sent" });
      })
      .catch((err) => RESPONSE.status(404).jsonp(err));
  } catch (err) {
    return RESPONSE.status(404).jsonp(err);
  }
};

collectorController.getTransactions = (req, res) => {
  const collectorID = req.query.ID;

  MODEL.transactionModel
    .find({ completedBy: collectorID })
    .then((transaction) => res.status(200).jsonp(transaction))
    .catch((err) => res.status(500).jsonp(err));
};

module.exports = collectorController;
