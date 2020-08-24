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
    if (ERR) return RESPONSE.status(422).jsonp(COMMON_FUN.sendError(ERR));
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

                      authy.register_user(
                        dataToSave.email,
                        dataToSave.phone,
                        "+234",
                        function (regErr, regRes) {
                          console.log("In Registration...");
                          if (regErr) {
                            return res.status(400).jsonp(regErr);
                            console.log(regErr);
                            //   RESPONSE.send('There was some error registering the user.');
                          } else if (regRes) {
                            console.log(regRes);
                            authy.request_sms(regRes.user.id, function (
                              smsErr,
                              smsRes
                            ) {
                              console.log("Requesting SMS...");
                              if (smsErr) {
                                return res.status(400).jsonp(smsErr);
                                console.log(smsErr);
                                //   RESPONSE.send('There was some error sending OTP to cell phone.');
                              } else if (smsRes) {
                                console.log("Twilio response here", smsRes);
                                return MODEL.collectorModel.updateOne(
                                  { email: dataToSave.email },
                                  { $set: { id: regRes.user.id } },
                                  (err, res) => {
                                    if (err)
                                      return RESPONSE.status(400).jsonp(err);
                                    MODEL.collectorModel
                                      .find({ email: dataToSave.email })
                                      .then((res) => {
                                        let UserData = {
                                          email: RESULT.email,
                                          phone: RESULT.phone,
                                          fullname: RESULT.fullname,
                                          id: res[0].id,
                                        };
                                        return RESPONSE.status(200).jsonp(
                                          COMMON_FUN.sendSuccess(
                                            CONSTANTS.STATUS_MSG.SUCCESS
                                              .DEFAULT,
                                            UserData
                                          )
                                        );

                                      })
                                      .catch((err) => {
                                        return RESPONSE.status(500).jsonp(err);
                                      });
                                  }
                                );
                              }
                            });
                          }
                        }
                      );
                      return MODEL.collectorModel.updateOne(
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


module.exports = collectorController;
