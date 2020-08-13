"use strict";

/**************************************************
 ***** User controller for user business logic ****
 **************************************************/
let userController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");

/**************************************************
 ****** Upload image or media (under process) *****
 **************************************************/

const tax_url =
  "https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer";

userController.upload = (REQUEST, RESPONSE) => {
  /** Stream
        // let myReadStream = FS.createReadStream(__dirname + '/index.js');
        // let myWriteStream = FS.createWriteStream( 'client/uploads/newfile.js' );
        // myReadStream.on('data', (chunks) => {
        //         console.log('new chunks received--- ', chunks);
        //         myWriteStream.write(chunks);
        // })
     */

  // myReadStream.pipe(myWriteStream);

  SERVICE.fileUpload(REQUEST, RESPONSE).then((result) => {
    return RESPONSE.jsonp({ status: true, message: result });
  });
};

/**************************************************
 ******************* Register User ****************
 **************************************************/
var authy = require("authy")("YHRjYqZNqXhIIUJ8oC7MIYKUZ6BN2pee");

userController.registerUser = (REQUEST, RESPONSE) => {
  // RESPONSE.jsonp(REQUEST.body);
  var need = {};
  let dataToSave = { ...REQUEST.body };

  COMMON_FUN.encryptPswrd(dataToSave.password, (ERR, PASSWORD) => {
    if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    else {
      dataToSave.password = PASSWORD;
      var errors = {};
      MODEL.userModel.findOne({ email: dataToSave.email }).then((user) => {
        if (user) {
          errors.email = "Email already exists";
          RESPONSE.status(400).jsonp(errors);
        } else {
          MODEL.userModel(dataToSave).save({}, (ERR, RESULT) => {
            if (ERR) RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
            else {
              request(
                {
                  url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
                  method: "POST",
                  json: true,
                  body: { data: { username: "xrubicon", password: "xrubicon1234" } },
                },
                function (error, response, body) {
                //  return response.headers.token;
                 request({
                  url: "https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer",
                  method: "POST",
                  headers: {
                      'Accept': 'application/json',
                      'Accept-Charset': 'utf-8',
                      'Token': response.headers.token
                  },
                  json: true,
                  body:  {
                    "data": {
                      "username": RESULT.username,
                      "firstname":RESULT.firstname,
                     "lastname": RESULT.lastname,
                      "othernames": RESULT.othernames,
                      "email": RESULT.email,
                      "phone":RESULT.phone,
                      "address": RESULT.address,
                    }
                  }
                }, function(err,res){
                  let card_id = res.body.content.data.cardID
                  need = {cardID: card_id, ...RESULT }
                  console.log("response", res.body.content.data.cardID );
                   return MODEL.userModel.updateOne({email: RESULT.email},{ $set: { "cardID" : card_id } },(res)=>{
                    console.log(res);
                  });                 
                            })
                          })
                          console.log("Card details here", need)

              authy.register_user(
                dataToSave.email,
                dataToSave.phoneNumber,
                dataToSave.countryCode,
                function (regErr, regRes) {
                  console.log("In Registration...");
                  if (regErr) {
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
                        console.log(smsErr);
                        //   RESPONSE.send('There was some error sending OTP to cell phone.');
                      } else if (smsRes) {
                        console.log(smsRes);
                        //   RESPONSE.send('OTP Sent to the cell phone.');
                      }
                    });
                  }
                }
              );
              let UserData = {
                email: RESULT.email,
                phoneNumber: RESULT.phoneNumber,
                username: RESULT.username,
                roles: RESULT.roles,
                cardID: RESULT.cardID
              };
              RESPONSE.jsonp(
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

/**************************************************
 ******************* Login User *******************
 **************************************************/
userController.loginUser = (REQUEST, RESPONSE) => {
  let CRITERIA = {
      $or: [
        { username: REQUEST.body.username },
        { email: REQUEST.body.username },
      ],
    },
    PROJECTION = { __v: 0, createAt: 0 };

  /** find user is exists or not */
  MODEL.userModel
    .findOne(CRITERIA, PROJECTION, { lean: true })
    .then((USER) => {
      USER /** matching password */
        ? COMMON_FUN.decryptPswrd(
            REQUEST.body.password,
            USER.password,
            (ERR, MATCHED) => {
              if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
              else if (!MATCHED)
                return RESPONSE.jsonp(
                  COMMON_FUN.sendSuccess(
                    CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD
                  )
                );
              else {
                let dataToJwt = {
                    username: USER.username,
                    Date: Date.now,
                    email: USER.email,
                    role: USER.roles,
                    cardID: USER.cardID,
                    phoneNumber: USER.phoneNumber,
                    verified: USER.verified,
                  },
                  jwtToken = COMMON_FUN.createToken(
                    dataToJwt
                  ); /** creating jwt token */
                dataToJwt.token = jwtToken;
                return RESPONSE.jsonp(dataToJwt);
              }
            }
          )
        : RESPONSE.jsonp(
            COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
          );
    })
    .catch((err) => {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    });
};

/**************************************************
 ******************* Forget Password **************
 **************************************************/
userController.forgotPassword = (REQUEST, RESPONSE) => {
  let CRITERIA = { email: REQUEST.body.email },
    PROJECTION = { __v: 0, createAt: 0 };
  /** find user is exists or not */
  MODEL.userModel
    .findOne(CRITERIA, PROJECTION, { lean: true })
    .then((USER) => {
      return USER;
    })
    .then((USER) => {
      /**
       * Generate Random number for OTP
       * */
      const OTP = COMMON_FUN.generateRandomString();

      const subject = CONSTANTS.MAIL_STATUS.OTP_SUB;
      USER.type = 0; // for forget password mail
      let saveToOTP = {
        userId: USER._id,
        userEmail: USER.email,
        otp: OTP,
      };
      RESPONSE.jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.CREATED, saveToOTP)
      );
    })
    .catch((ERR) => {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    });
};

/**************************************************
 ******************* Change Password **************
 **************************************************/
userController.changePassword = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let checkUserExist = await MODEL.userModel.findOne(
      { email: REQUEST.body.email },
      {},
      { lean: true }
    );

    if (checkUserExist) {
      /********** encrypt password ********/
      COMMON_FUN.encryptPswrd(REQUEST.body.password, (ERR, HASH) => {
        /********** update password in usermodel ********/
        MODEL.userModel
          .update({ email: REQUEST.body.email }, { $set: { password: HASH } })
          .then((SUCCESS) => {
            return RESPONSE.jsonp(
              COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
            );
          })
          .catch((ERR) => {
            return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
          });
      });
    } else {
      return RESPONSE.jsonp(
        COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL)
      );
    }
  } catch (ERR) {
    return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
  }
};

/**************************************************
 ********* change loggged in user password ********
 **************************************************/
userController.changedlogedInPassword = (REQUEST, RESPONSE) => {
  let BODY = REQUEST.body;
  COMMON_FUN.objProperties(REQUEST.body, (ERR, RESULT) => {
    if (ERR) {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.userModel
        .findOne({ email: REQUEST.body.username }, {}, { lean: true })
        .then((RESULT) => {
          if (!RESULT)
            return RESPONSE.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND)
            );
          else {
            COMMON_FUN.decryptPswrd(
              BODY.currentPassword,
              RESULT.password,
              (ERR, isMatched) => {
                if (ERR) {
                  return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
                } else if (isMatched) {
                  COMMON_FUN.encryptPswrd(BODY.newPassword, (ERR, HASH) => {
                    if (ERR)
                      return RESPONSE.jsonp(
                        COMMON_FUN.sendError(
                          CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD
                        )
                      );
                    else {
                      MODEL.userModel
                        .update(
                          { email: BODY.username },
                          { $set: { password: HASH } },
                          {}
                        )
                        .then((SUCCESS) => {
                          return RESPONSE.jsonp(
                            COMMON_FUN.sendSuccess(
                              CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT
                            )
                          );
                        })
                        .catch((ERR) => {
                          return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
                        });
                    }
                  });
                } else {
                  return RESPONSE.jsonp(
                    COMMON_FUN.sendError(
                      CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD
                    )
                  );
                }
              }
            );
          }
        })
        .catch((ERR) => {
          return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        });
    }
  });
};

userController.resendVerification = (REQUEST, RESPONSE) => {
  authy.register_user(
    dataToSave.email,
    dataToSave.phoneNumber,
    dataToSave.countryCode,
    function (regErr, regRes) {
      console.log("In Registration...");
      if (regErr) {
        console.log(regErr);
        RESPONSE.send("There was some error registering the user.");
      } else if (regRes) {
        console.log(regRes);
        authy.request_sms(regRes.user.id, function (smsErr, smsRes) {
          console.log("Requesting SMS...");
          if (smsErr) {
            console.log(smsErr);
            RESPONSE.send("There was some error sending OTP to cell phone.");
          } else if (smsRes) {
            console.log(smsRes);
            RESPONSE.send("OTP Sent to the cell phone.");
          }
        });
      }
    }
  );
};
userController.verifyPhone = (REQUEST, RESPONSE) => {
  var id = REQUEST.param("id");
  var token = REQUEST.param("token");

  authy.verify(id, token, function (verifyErr, verifyRes) {
    console.log("In Verification...");
    if (verifyErr) {
      console.log(verifyErr);
      RESPONSE.send("OTP verification failed.");
    } else if (verifyRes) {
      console.log(verifyRes);
      RESPONSE.send("OTP Verified.");
    }
  });
};

userController.getAllClients = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel.find({ roles: "client" });
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.jsonp(err);
  }
};

userController.getWalletBalance = (req, res)=>{

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
          url: `https://apis.touchandpay.me/lawma-backend/v1/agent/get/customer/card/${req.query.cardID}`,
          method: "GET",
          headers: {
              'Accept': 'application/json',
              'Accept-Charset': 'utf-8',
              'Token': response.headers.token
                 },
          json: true,        },
          function(error, response, body) {
            res.jsonp(response);
          }
         )
        }
      );
}

userController.getAllCollectors = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel.find({ roles: "collector" });
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.jsonp(err);
  }
};

/* export userControllers */
module.exports = userController;