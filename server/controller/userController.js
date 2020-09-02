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
var twilio = require("twilio");

/**************************************************
 ****** Upload image or media (under process) *****
 **************************************************/

const io = require("socket.io")();

io.on("connection", (client) => {
  client.on("subscribeToTimer", (interval) => {
    console.log("client is subscribing to event ", interval);
    // setInterval(() => {
    //   client.emit('timer', new Date());
    // }, interval);
  });
});

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

                      // authy.register_user(
                      //   dataToSave.email,
                      //   dataToSave.phone,
                      //   "+234",
                      //   function (regErr, regRes) {
                      //     console.log("In Registration...");
                      //     if (regErr) {
                      //       return res.status(400).jsonp(regErr);
                      //       console.log(regErr);
                      //       //   RESPONSE.send('There was some error registering the user.');
                      //     } else if (regRes) {
                      //       console.log(regRes);
                      //       authy.request_sms(regRes.user.id, function (
                      //         smsErr,
                      //         smsRes
                      //       ) {
                      //         console.log("Requesting SMS...");
                      //         if (smsErr) {
                      //           return res.status(400).jsonp(smsErr);
                      //           console.log(smsErr);
                      //           //   RESPONSE.send('There was some error sending OTP to cell phone.');
                      //         } else if (smsRes) {
                      //           console.log("Twilio response here", smsRes);
                      //           return MODEL.userModel.updateOne(
                      //             { email: dataToSave.email },
                      //             { $set: { id: regRes.user.id } },
                      //             (err, res) => {

                      //               if (err) return RESPONSE.status(400).jsonp(err)
                      //               MODEL.userModel
                      //                 .find({ email: dataToSave.email })
                      //                 .then((res) => {
                      //                   console.log(
                      //                     "The id I am looking for",
                      //                     res[0]
                      //                   );

                      //                   let UserData = {
                      //                     email: RESULT.email,
                      //                     phoneNumber: RESULT.phoneNumber,
                      //                     username: RESULT.username,
                      //                     roles: RESULT.roles,
                      //                     id: res[0].id,
                      //                   };
                      //                   return RESPONSE.status(200).jsonp(
                      //                     COMMON_FUN.sendSuccess(
                      //                       CONSTANTS.STATUS_MSG.SUCCESS
                      //                         .DEFAULT,
                      //                       UserData
                      //                     )
                      //                   );

                      //                   console.log(
                      //                     "All response here",
                      //                     resUpdate[0]
                      //                   );
                      //                 })
                      //                 .catch((err) =>{
                      //                   return RESPONSE.status(500).jsonp(err)

                      //                 }
                      //                 );

                      //               // MODEL.userModel.find({"email": dataToSave.email}).then(res=>console.log("All response here", res[0])).catch(err=> RESPONSE.status(400).jsonp(err))
                      //               // console.log(res);
                      //             }
                      //           );
                      //           console.log(smsRes);
                      //           //   RESPONSE.send('OTP Sent to the cell phone.');
                      //         }
                      //       });
                      //     }
                      //   }
                      // );
                      MODEL.userModel.updateOne(
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

              // let UserData = {
              //   email: RESULT.email,
              //   phoneNumber: RESULT.phoneNumber,
              //   username: RESULT.username,
              //   roles: RESULT.roles,
              //   id: resUpdate[0].id

              // };
              // RESPONSE.status(200).jsonp(
              //   COMMON_FUN.sendSuccess(
              //     CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
              //     UserData
              //   )
              // );

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

/**************************************************
 ******************* Login User *******************
 **************************************************/
userController.loginUser = (REQUEST, RESPONSE) => {
  let CRITERIA = {
      $or: [{ username: REQUEST.body.username }, { email: REQUEST.body.email }],
    },
    PROJECTION = { __v: 0, createAt: 0 };

  // Download the helper library from https://www.twilio.com/docs/node/install
  // Your Account Sid and Auth Token from twilio.com/console
  // DANGER! This is insecure. See http://twil.io/secure

  /** find user is exists or not */
  MODEL.userModel
    .findOne(CRITERIA, PROJECTION, { lean: true })
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

/**************************************************
 ******************* Forget Password **************
 **************************************************/
userController.forgotPassword = (REQUEST, RESPONSE) => {
  let CRITERIA = { email: REQUEST.body.email },
    PROJECTION = { __v: 0, createAt: 0 };
  /** check if user exists or not */
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
      return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));
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

userController.updateUser = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let checkUserExist = await MODEL.userModel.findOne(
      { email: REQUEST.body.email },
      {},
      { lean: true }
    );

    if (checkUserExist) {
      /********** encrypt password ********/
      // COMMON_FUN.encryptPswrd(REQUEST.body.password, (ERR, HASH) => {
      //   /********** update password in usermodel ********/
      //   MODEL.userModel
      //     .update({ email: REQUEST.body.email }, { $set: { password: HASH } })
      //     .then((SUCCESS) => {
      //       return RESPONSE.jsonp(
      //         COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
      //       );
      //     })
      //     .catch((ERR) => {
      //       return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
      //     });
      // });

      MODEL.userModel
        .update(
          { email: REQUEST.body.email },
          {
            $set: {
              phone: REQUEST.body.phone,
              gender: REQUEST.body.gender,
              dateOfBirth: REQUEST.body.dateOfBirth,
              address: REQUEST.body.address,
              fullname: REQUEST.body.fullname,
            },
          }
        )
        .then((SUCCESS) => {
          return RESPONSE.jsonp(
            COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
          );
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

userController.verifyPhone = (REQUEST, RESPONSE) => {
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
        MODEL.userModel.updateOne(
          { phone: phone },
          { verified: true },
          (res) => {

            MODEL.userModel
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

userController.getAllClients = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel.find({ roles: "client" });
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.status(400).jsonp(err);
  }
};

userController.getWalletBalance = (req, res) => {
  request(
    {
      url: "https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent",
      method: "POST",
      json: true,
      body: { data: { username: "xrubicon", password: "xrubicon1234" } },
    },
    function (error, response, body) {
      response.headers.token;

      request(
        {
          url: `https://apis.touchandpay.me/lawma-backend/v1/agent/get/customer/card/${req.query.cardID}`,
          method: "GET",
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
            Token: response.headers.token,
          },
          json: true,
        },
        function (error, response, body) {
          res.jsonp(response.body.content.data);
        }
      );
    }
  );
};

userController.getAllCollectors = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel.find({ roles: "collector" });
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.status(400).jsonp(err);
  }
};

/* export userControllers */
module.exports = userController;
