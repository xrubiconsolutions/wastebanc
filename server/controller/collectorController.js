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

var authy = require("authy")("YHRjYqZNqXhIIUJ8oC7MIYKUZ6BN2pee");

collectorController.registerCollector = (REQUEST, RESPONSE) => {
  // RESPONSE.jsonp(REQUEST.body);
  var need = {};
  let dataToSave = { ...REQUEST.body };

  COMMON_FUN.encryptPswrd(dataToSave.password, (ERR, PASSWORD) => {
    if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    else {
      dataToSave.password = PASSWORD;
      var errors = {};
      MODEL.collectorModel.findOne({ email: dataToSave.email }).then((user) => {
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

                      const accountSid = "AC0e54e99aff7296ab5c7bf52d86eee9d8";
                      const authToken = "549de52669fc3ecc350232c978f52bb0";
                      const client = require("twilio")(accountSid, authToken);

                      client.verify
                        .services("VAd381ebb546a1c58a240474d1a16ee26b")
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

              let UserData = {
                                    email: RESULT.email,
                                    phone: RESULT.phone,
                                    username: RESULT.username,
                                    roles: RESULT.roles,
                                  };
                                  return RESPONSE.status(200).jsonp(
                                    COMMON_FUN.sendSuccess(
                                      CONSTANTS.STATUS_MSG.SUCCESS
                                        .DEFAULT,
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
    .findOne({fullname: REQUEST.body.fullname}, PROJECTION, { lean: true })
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

  const collectorID = REQUEST.query.ID
  MODEL.scheduleModel
    .find({ collectorStatus: "accept", collectedBy : collectorID })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

collectorController.checkCompleted = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID

  MODEL.scheduleModel
    .find({ completionStatus: "completed", collectedBy: collectorID})
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};


collectorController.checkMissed = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.query.ID

  MODEL.scheduleModel
    .find({ completionStatus: "missed",  collectedBy: collectorID })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
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



module.exports = collectorController;
