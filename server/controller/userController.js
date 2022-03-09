"use strict";

/**************************************************
 ***** User controller for user business logic ****
 **************************************************/
let userController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
// const { Response } = require('aws-sdk');
var request = require("request");
const streamifier = require("streamifier");
const { validationResult, body } = require("express-validator");

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const ustorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./client/");
  },
  filename: function (req, file, cb) {
    // let fileName = file.originalname.split(".");
    // let fileExtension = fileName[fileName.length - 1];
    cb(null, Date.now() + "." + file.originalname);
  },
});

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

const fileUpload = multer({ storage: ustorage });

cloudinary.config({
  cloud_name: "pakam",
  api_key: "865366333135586",
  api_secret: "ONCON8EsT1bNyhCGlXLJwH2lsy8",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Pakam",
  },
});

const parser = multer({ storage: storage });

var nodemailer = require("nodemailer");

const io = require("socket.io")();

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pakambusiness@gmail.com",
    pass: "pakambusiness-2000",
  },
});

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
      console.log("Response:");
      console.log(JSON.parse(data));
    });
  });

  req.on("error", function (e) {
    console.log("ERROR:");
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

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
      dataToSave.email = dataToSave.email.trim();
      var errors = {};
      MODEL.userModel
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
            errors.message = "User already exists";
            RESPONSE.status(400).jsonp(errors);
          } else {
            MODEL.userModel(dataToSave).save({}, (ERR, RESULT) => {
              if (ERR) RESPONSE.status(400).jsonp(ERR);
              else {
                var test = JSON.parse(JSON.stringify(RESULT));
                var jwtToken =
                  COMMON_FUN.createToken(test); /** creating jwt token */
                test.token = jwtToken;

                MODEL.userModel.updateOne(
                  { email: RESULT.email },
                  {
                    $set: {
                      cardID: RESULT._id,
                    },
                  },
                  (res) => {
                    var phoneNo = String(RESULT.phone).substring(1, 11);
                    var data = {
                      api_key:
                        "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
                      message_type: "NUMERIC",
                      to: `+234${phoneNo}`,
                      from: "N-Alert",
                      channel: "dnd",
                      pin_attempts: 10,
                      pin_time_to_live: 5,
                      pin_length: 4,
                      pin_placeholder: "< 1234 >",
                      message_text:
                        "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
                      pin_type: "NUMERIC",
                    };
                    var options = {
                      method: "POST",
                      url: "https://termii.com/api/sms/otp/send",
                      headers: {
                        "Content-Type": [
                          "application/json",
                          "application/json",
                        ],
                      },
                      body: JSON.stringify(data),
                    };
                    request(options, function (error, response) {
                      const iden = JSON.parse(response.body);
                      if (error) {
                        throw new Error(error);
                      } else {
                        // let UserData = {
                        //   email: RESULT.email,
                        //   phone: RESULT.phone,
                        //   username: RESULT.username,
                        //   roles: RESULT.roles,
                        //   pin_id: response.body.pin_id
                        // };
                        let UserData = {
                          ...test,
                          pin_id: iden.pinId,
                        };

                        var data = {
                          api_key:
                            "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
                          phone_number: `+234${phoneNo}`,
                          country_code: "NG",
                        };
                        var options = {
                          method: "GET",
                          url: " https://termii.com/api/insight/number/query",
                          headers: {
                            "Content-Type": [
                              "application/json",
                              "application/json",
                            ],
                          },
                          body: JSON.stringify(data),
                        };
                        request(options, function (error, response) {
                          if (error) throw new Error(error);
                          var mobileData = JSON.parse(response.body);
                          // var mobile_carrier =
                          //   mobileData.result[0].operatorDetail.operatorName;
                          MODEL.userModel.updateOne(
                            { email: RESULT.email },
                            {
                              $set: {
                                fullname:
                                  RESULT.username.split(" ")[0] +
                                  " " +
                                  RESULT.username.split(" ")[1],
                                //mobile_carrier: mobile_carrier,
                              },
                            },
                            (res) => {
                              return RESPONSE.status(200).jsonp(UserData);
                            }
                          );
                        });
                      }
                    });
                  }
                );

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
                //   function (error, response, body) {
                //     //  return response.headers.token;
                //     request(
                //       {
                //         url:
                //           'https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer',
                //         method: 'POST',
                //         headers: {
                //           Accept: 'application/json',
                //           'Accept-Charset': 'utf-8',
                //           Token: response.headers.token,
                //         },
                //         json: true,
                //         body: {
                //           data: {
                //             username: RESULT.username,
                //             firstname: RESULT.firstname,
                //             lastname: RESULT.lastname,
                //             othernames: RESULT.othernames,
                //             email: RESULT.email,
                //             phone: RESULT.phone,
                //             address: RESULT.address,
                //           },
                //         },
                //       },
                //       function (err, res) {
                //         let card_id = res.body.content.data.cardID;
                //         need = { cardID: card_id, ...RESULT };

                //         // TERMII IMPLEMENTATION

                //         const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
                //         const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
                //         const client = require('twilio')(accountSid, authToken);

                //         client.verify
                //           .services('VAeaa492de9598c3dcce55fd9243461ab3')
                //           .verifications.create({
                //             to: `+234${dataToSave.phone}`,
                //             channel: 'sms',
                //           })
                //           .then((verification) =>
                //             console.log(verification.status)
                //           );

                //         client.lookups
                //           .phoneNumbers(`+234${dataToSave.phone}`)
                //           .fetch({ type: ['carrier'] })
                //           .then((phone_number) =>
                //             MODEL.userModel.updateOne(
                //               { email: RESULT.email },
                //               {
                //                 $set: {
                //                   cardID: card_id,
                //                   firstname: RESULT.username.split(' ')[0],
                //                   lastname: RESULT.username.split(' ')[1],
                //                   fullname: RESULT.username.split(' ')[0] + " " + RESULT.username.split(' ')[1],
                //                   mobile_carrier: phone_number.carrier.name,
                //                 },
                //               },
                //               (res) => {
                //                 //BYPASS FOR TESTING PURPOSE
                //                 MODEL.userModel.findOne(
                //                   { email: RESULT.email },
                //                   (err, USER) => {
                //                     var test = JSON.parse(JSON.stringify(USER));

                //                     if (err)
                //                       return RESPONSE.status(400).jsonp(error);
                //                     console.log('user here at all', USER);
                //                     var jwtToken = COMMON_FUN.createToken(
                //                       test
                //                     ); /** creating jwt token */
                //                     console.log('user token here at all', USER);
                //                     test.token = jwtToken;
                //                     return RESPONSE.status(200).jsonp(
                //                       COMMON_FUN.sendSuccess(
                //                         CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                //                         test
                //                       )
                //                     );
                //                   }
                //                 );

                //                 console.log(res);
                //               }
                //             )
                //           );
                //       }
                //     );
                //   }
                // );
              }
            });
          }
        });
    }
  });
};

userController.passwordEncrypt = async (req, res) => {
  const password = await COMMON_FUN.encryptPassword(req.body.password);
  return res.status(200).json({
    data: {
      password: req.body.password.trim(),
      passwordHash: password,
      email: req.email,
    },
  });
};

/**************************************************
 ******************* Login User *******************
 **************************************************/
userController.loginUser = async (REQUEST, RESPONSE) => {
  let CRITERIA = {
      $or: [{ phone: REQUEST.body.phone }, { email: REQUEST.body.email }],
    },
    PROJECTION = { __v: 0, createAt: 0 };

  // Download the helper library from https://www.twilio.com/docs/node/install
  // Your Account Sid and Auth Token from twilio.com/console
  // DANGER! This is insecure. See http://twil.io/secure

  /** find user is exists or not */
  // const user = await MODEL.userModel.findOne(CRITERIA);
  // console.log("user", user);
  // return RESPONSE.json({
  //   data: user,
  // });
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
                var jwtToken =
                  COMMON_FUN.createToken(USER); /** creating jwt token */

                MODEL.userModel.updateOne(
                  { phone: REQUEST.body.phone },
                  { last_logged_in: new Date() },
                  (res) => {
                    console.log("Logged date updated", new Date());
                  }
                );

                USER.token = jwtToken;

                return RESPONSE.jsonp(USER);
              }
            }
          )
        : RESPONSE.status(400).jsonp({
            message: "Invalid phone number",
          });
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
  var mailOptions = {
    from: "pakambusiness@gmail.com",
    to: `${REQUEST.body.email}`,
    subject: "FORGOT PASSWORD MAIL",
    text: "Forgot password?",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

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

    console.log("<<<<<>>>>", checkUserExist);
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
              lcd: REQUEST.body.lcd,
              profile_picture: REQUEST.body.profile_picture,
            },
          }
        )
        .then((SUCCESS) => {
          MODEL.userModel
            .findOne({ email: REQUEST.body.email })
            .then((user) => {
              if (!user) {
                return RESPONSE.status(400).json({
                  message: "User not found",
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

userController.resendVerification = async (REQUEST, RESPONSE) => {
  // var error = {};
  // var phone = REQUEST.body.phone;

  // const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  // const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  // const client = require('twilio')(accountSid, authToken);

  // try {
  //   client.verify
  //     .services('VAeaa492de9598c3dcce55fd9243461ab3	')
  //     .verifications.create({
  //       to: `+234${phone}`,
  //       channel: 'sms',
  //     })
  //     .then((verification) => {
  //       console.log(verification.status);
  //       return RESPONSE.status(200).jsonp({
  //         message: 'Verification code sent',
  //       });
  //     })
  //     .catch((err) => RESPONSE.status(404).jsonp(err));
  // } catch (err) {
  //   return RESPONSE.status(404).jsonp(err);
  // }
  var error = {};
  var phone = REQUEST.body.phone;
  const user = await MODEL.userModel.findOne({
    phone,
  });

  if (!phone) {
    return RESPONSE.status(400).json({
      error: true,
      message: "Phone does not exist",
    });
  }
  var phoneNo = String(phone).substring(1, 11);

  const accountSid = "AC21bbc8152a9b9d981d6c86995d0bb806";
  const authToken = "3c53aeab8e3420f00e7b05777e7413a9";

  const client = require("twilio")(accountSid, authToken);

  try {
    var data = {
      api_key: "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
      message_type: "NUMERIC",
      to: `+234${phoneNo}`,
      from: "N-Alert",
      channel: "dnd",
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 4,
      pin_placeholder: "< 1234 >",
      message_text:
        "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
      pin_type: "NUMERIC",
    };
    var options = {
      method: "POST",
      url: "https://termii.com/api/sms/otp/send",
      headers: {
        "Content-Type": ["application/json", "application/json"],
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

userController.verifyPhone = (REQUEST, RESPONSE) => {
  //   var error = {};
  //   var token = REQUEST.body.token;
  //   var phone = REQUEST.body.phone;
  //   const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  //   const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  //   const client = require('twilio')(accountSid, authToken);

  //   // TERMII VERIFICATION

  // //   var data = {
  // //     "api_key": "Your API key",
  // //     "pin_id": "c8dcd048-5e7f-4347-8c89-4470c3af0b",
  // //     "pin": "195558"
  // // };
  // // var options = {
  // // 'method': 'POST',
  // // 'url': 'https://termii.com/api/sms/otp/verify',
  // // 'headers': {
  // // 'Content-Type': ['application/json', 'application/json']
  // // },
  // // body: JSON.stringify(data)

  // // };
  // // request(options, function (error, response) {
  // // if (error) throw new Error(error);
  // // console.log(response.body);
  // // });

  //   try {
  //     client.verify
  //       .services('VAeaa492de9598c3dcce55fd9243461ab3')
  //       .verificationChecks.create({
  //         to: `+234${phone}`,
  //         code: `${token}`,
  //       })
  //       .then((verification_check) => {
  //         if (verification_check.status == 'approved') {
  //           console.log(verification_check.status);
  //           MODEL.userModel.updateOne(
  //             { phone: phone },
  //             { verified: true },
  //             (res) => {
  //               MODEL.userModel.findOne({ phone: phone }, (err, USER) => {
  //                 var test = JSON.parse(JSON.stringify(USER));

  //                 if (err) return RESPONSE.status(400).jsonp(error);
  //                 console.log('user here at all', USER);
  //                 var jwtToken = COMMON_FUN.createToken(
  //                   test
  //                 ); /** creating jwt token */
  //                 console.log('user token here at all', test, jwtToken);
  //                 test.token = jwtToken;
  //                 return RESPONSE.status(200).json(test);
  //               });
  //             }
  //           );
  //         } else {
  //           return RESPONSE.status(404).json({
  //             message: 'Wrong OTP !',
  //           });
  //         }
  //       })
  //       .catch((err) =>
  //         RESPONSE.status(404).json({
  //           message: 'Wrong OTP !',
  //         })
  //       );
  //   } catch (err) {
  //     return RESPONSE.status(404).json({
  //       err,
  //     });
  //   }

  var error = {};
  var phone = REQUEST.body.phone;
  var token = REQUEST.body.token;
  var pin_id = REQUEST.body.pin_id;

  var data = {
    api_key: "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
    pin_id: pin_id,
    pin: token,
  };

  console.log("data", data);
  var options = {
    method: "POST",
    url: "https://termii.com/api/sms/otp/verify",
    headers: {
      "Content-Type": ["application/json", "application/json"],
    },
    body: JSON.stringify(data),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);

    console.log("response", response);
    const verified = JSON.parse(response.body);
    if (verified.verified == true) {
      MODEL.userModel.updateOne({ phone: phone }, { verified: true }, (res) => {
        MODEL.userModel.findOne({ phone: phone }, (err, USER) => {
          var test = JSON.parse(JSON.stringify(USER));

          if (err) return RESPONSE.status(400).jsonp(error);
          console.log("user here at all", USER);
          var jwtToken = COMMON_FUN.createToken(test); /** creating jwt token */
          console.log("user token here at all", USER);
          test.token = jwtToken;
          return RESPONSE.jsonp(test);
        });
      });
    } else if (verified.verified === "Expired") {
      return RESPONSE.status(400).json({
        message: "Token expired",
      });
    } else {
      return RESPONSE.status(400).json({
        message: "Invalid token, retry",
      });
    }
    console.log(response.body);
  });
};

userController.getAllClients = async (REQUEST, RESPONSE) => {
  console.log("here");
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel
      .find({ roles: "client", verified: true })
      .sort({ _id: -1 });
    return RESPONSE.jsonp(users);
  } catch (err) {
    return RESPONSE.status(400).jsonp(err);
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
          return res.jsonp(response.body.content.data);
        }
      );
    }
  );
};

userController.getAllCollectors = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.collectorModel
      .find({ verified: true })
      .sort({ _id: -1 });
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.status(400).jsonp(err);
  }
};

userController.resetMobile = (REQUEST, RESPONSE) => {
  const phone = REQUEST.body.phone;
  const token = REQUEST.body.token;
  const pin_id = REQUEST.body.pin_id;

  var phoneNo = String(phone).substring(1, 11);

  var data = {
    api_key: "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
    message_type: "NUMERIC",
    to: `+234${phoneNo}`,
    from: "N-Alert",
    channel: "dnd",
    pin_attempts: 10,
    pin_time_to_live: 5,
    pin_length: 4,
    pin_placeholder: "< 1234 >",
    message_text:
      "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
    pin_type: "NUMERIC",
  };

  var data = {
    api_key: "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
    pin_id: pin_id,
    pin: token,
  };
  var options = {
    method: "POST",
    url: "https://termii.com/api/sms/otp/verify",
    headers: {
      "Content-Type": ["application/json", "application/json"],
    },
    body: JSON.stringify(data),
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);

    MODEL.userModel.updateOne({ phone: phone }, { verified: true }, (res) => {
      MODEL.userModel.findOne({ phone: phone }, (err, USER) => {
        var test = JSON.parse(JSON.stringify(USER));
        if (err) return RESPONSE.status(400).jsonp(error);
        console.log("user here at all", USER);
        var jwtToken = COMMON_FUN.createToken(test); /** creating jwt token */
        console.log("user token here at all", USER);
        test.token = jwtToken;
        return RESPONSE.jsonp(test);
      });
    });
  });
};

userController.resetMobilePassword = (REQUEST, RESPONSE) => {
  const phone = REQUEST.body.phone;
  MODEL.userModel.findOne({ phone: phone }).then((result) => {
    if (!result) {
      return RESPONSE.status(400).json({
        message: " This account is not verified ",
      });
    }

    COMMON_FUN.encryptPswrd(REQUEST.body.password, (ERR, HASH) => {
      /********** update password in usermodel ********/
      MODEL.userModel
        .updateOne({ phone: phone }, { $set: { password: HASH } })
        .then((SUCCESS) => {
          return RESPONSE.jsonp(
            COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
          );
        })
        .catch((ERR) => {
          return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
        });
    });
  });
};

// userController.getTransactions = (req, res) => {
//   MODEL.transactionModel.find({}).then((result, err) => {
//     var need = result.map((x) => x.cardID);
//     var uniq = [...new Set(need)];
//     console.log('--->', uniq);
//     var responseData = []

//     for(var i = 0 ; i < uniq.length -1 ; i++){
//      request(
//         {
//           url: `https://apis.touchandpay.me/lawma-backend/v1/customer/get/customer/card/${uniq[i]}/transactions`,
//           method: 'GET',
//           headers: {
//             Accept: 'application/json',
//             'Accept-Charset': 'utf-8',
//             Token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NywidXNlcm5hbWUiOiJ4cnViaWNvbi1yZWN5Y2xlciIsIm5hbWUiOiJYcnViaWNvbiIsInBob25lIjoiMDcwMzA2NzQwMzUiLCJlbWFpbCI6ImFkbWluQHhydWJpY29uLmNvbSIsImFkZHJlc3MiOiJMYWdvcywgTmlnZXJpYS4iLCJ1c2VydHlwZSI6MSwicHVibGljS2V5IjoicHJmMWg2Z3NZMWdGIiwiaXNzIjoicGF5cm9sbG1uZ3IiLCJhdWQiOiJwYXlyb2xsbW5nciIsImlhdCI6MTYwMDA3NDU5MCwibmJmIjoxNjAwMDc0NTkwfQ.L4vI-DH5pKQ5u5ROt5KU78trv2nW51luTaYnrdt2szg`,
//           },
//           json: true,
//         },
//         function (error, response, body) {
//           responseData.push(response.body.content.data);

//           if(i == uniq.length-1){
//             console.log('--->', responseData)
//             return res.status(200).json(responseData)

//           }
//           console.log('--->', responseData.length)
//         });
//       }

//   });
// };

userController.getUserTransactions = (req, res) => {
  const cardID = req.query.cardID;
  const PROJECTION = {
    paid: 0,
    cardID: 0,
    scheduleId: 0,
    __V: 0,
    weight: 0,
    fullname: 0,
    completedBy: 0,
    organisationID: 0,
  };
  MODEL.transactionModel.find({ cardID: cardID }, PROJECTION).then((result) => {
    return res.status(200).json(result);
  });
};

userController.uploadProfile = (req, res) => {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });
      streamifier.createReadStream(req.files.image.data).pipe(stream);
    });
  };

  async function upload(req) {
    let result = await streamUpload(req);

    return res.status(200).json(result);
  }

  upload(req);
};

userController.dailyActive = (req, res) => {
  const today = new Date();
  const active_today = new Date();
  active_today.setHours(0, 0, 0, 0);

  try {
    MODEL.userModel
      .find({
        verified: true,
        roles: "client",
        last_logged_in: {
          $gte: active_today,
        },
      })
      .sort({ _id: -1 })
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json(result);
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.newActiveUser = (req, res) => {
  const today = new Date();
  const active_today = new Date();
  active_today.setDate(today.getDate() - 1);
  try {
    MODEL.userModel
      .find({
        verified: true,
        roles: "client",
        createAt: {
          $gte: active_today,
        },
      })
      .sort({ _id: -1 })
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json(result);
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.expiryDateFilter = (req, res) => {
  const page = parseInt(req.query.page);

  const PAGE_SIZE = parseInt(req.query.PAGE_SIZE);
  const skip = (page - 1) * PAGE_SIZE; // For page 1, the skip is: (1 - 1)
  try {
    MODEL.userModel
      .find()
      .skip(skip)
      .limit(PAGE_SIZE)
      .sort({ createAt: -1 })
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json(result);
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.advertControl = (req, res) => {
  const advert = { ...req.body };

  try {
    MODEL.advertModel(advert).save({}, (ERR, RESULT) => {
      return res.status(200).json({
        message: "Advert Posted Successfully",
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.updateAdvert = (req, res) => {
  const advert = { ...req.body };

  try {
    MODEL.advertModel.updateOne(
      { _id: req.body._id },
      {
        $set: {
          title: req.body.title,
          advert_url: req.body.advert_url,
          duration: req.body.duration,
          start_date: req.body.start_date,
          thumbnail_url: req.body.thumbnail_url,
        },
      },
      (resp) => {
        return res.status(200).json({
          message: "Advert Updated Successfully",
        });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.adsLook = (REQUEST, RESPONSE) => {
  var today = new Date();
  MODEL.advertModel
    .find({
      authenticated: true,
    })
    .then((advert) => {
      const test = advert.filter((x) => x.duration - today > 0);
      console.log("test", test);
      return RESPONSE.status(200).json(test);
    });
};

userController.updatePhoneSpecifications = async (REQUEST, RESPONSE) => {
  try {
    let checkUserExist = await MODEL.userModel.findOne(
      { email: REQUEST.body.email },
      {},
      { lean: true }
    );

    MODEL.userModel.updateOne(
      { email: REQUEST.body.email },
      { last_logged_in: new Date() },
      (res) => {
        console.log("Logged date updated", new Date());
      }
    );

    if (checkUserExist) {
      MODEL.userModel
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
          MODEL.userModel
            .findOne({ email: REQUEST.body.email })
            .then((user) => {
              if (!user) {
                return RESPONSE.status(400).json({
                  message: "User not found",
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

userController.androidUsers = (req, res) => {
  try {
    MODEL.userModel
      .find({
        verified: true,
        phone_OS: "android",
      })
      .sort({
        _id: -1,
      })
      .then((result) => {
        MODEL.collectorModel
          .find({ verified: true, phone_OS: "android" })
          .sort({
            _id: -1,
          })
          .then((recycler) => {
            var data = [...result, ...recycler];
            return res.status(200).json({
              data: data,
            });
          });
      });
  } catch (err) {
    res.status(500).json(err);
  }
};

userController.iosUsers = (req, res) => {
  try {
    MODEL.userModel
      .find({
        verified: true,
        phone_OS: "ios",
      })
      .sort({
        _id: -1,
      })
      .then((result) => {
        MODEL.collectorModel
          .find({
            verified: true,
            phone_OS: "ios",
          })
          .sort({
            _id: -1,
          })
          .then((recycler) => {
            var data = [...result, ...recycler];
            return res.status(200).json({
              data: data,
            });
          });
      });
  } catch (err) {
    res.status(500).json(err);
  }
};

userController.desktopUsers = (req, resp) => {
  try {
    request(
      {
        url: "https://pakam-business.herokuapp.com/api/getAllClients",
        method: "GET",
        headers: {
          Accept: "application/json",
          "Accept-Charset": "utf-8",
        },
      },
      function (err, res) {
        let result = JSON.parse(res.body).reverse();

        return resp.status(200).json(result);
      }
    );
  } catch (err) {
    return resp.status(500).json(err);
  }
};

userController.deviceAnalytics = (REQUEST, RESPONSE) => {
  try {
    MODEL.userModel
      .find({
        verified: true,
        phone_OS: "android",
      })
      .sort({ _id: -1 })
      .then((android) => {
        MODEL.collectorModel
          .find({ verified: true, phone_OS: "android" })
          .then((android_re) => {
            MODEL.collectorModel
              .find({
                verified: true,
                phone_OS: "ios",
              })
              .then((ios_re) => {
                MODEL.userModel
                  .find({
                    verified: true,
                    phone_OS: "ios",
                  })
                  .sort({ _id: -1 })
                  .then((ios) => {
                    request(
                      {
                        url: "https://pakam-business.herokuapp.com/api/getAllClients",
                        method: "GET",
                        headers: {
                          Accept: "application/json",
                          "Accept-Charset": "utf-8",
                        },
                      },
                      function (err, resp) {
                        var desktop = JSON.parse(resp.body);
                        console.log("<ios re>", ios_re.length);
                        console.log("<ios us>", ios.length);
                        return RESPONSE.status(200).json({
                          android: android.length + android_re.length,
                          ios: ios.length + ios_re.length,
                          desktop: desktop.length,
                        });
                      }
                    );
                  });
              });
          });
      });
  } catch (err) {
    RESPONSE.status(500).json(err);
  }
};

userController.deleteUser = (req, res) => {
  const userID = req.body.userID;
  try {
    MODEL.userModel
      .deleteOne({
        _id: userID,
      })
      .then((result) => {
        return res.status(200).json({
          message: "User deleted successfully",
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.userAnalytics = (req, res) => {
  const active_today = new Date();
  active_today.setHours(0, 0, 0, 0);

  active_today.setHours(0, 0, 0, 0);
  active_today.setHours(active_today.getHours() + 1);

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setHours(yesterday.getHours() + 1);

  try {
    MODEL.userModel
      .find({
        verified: true,
        roles: "client",
      })
      .then((allUser) => {
        MODEL.userModel
          .find({
            verified: true,
            roles: "client",
            createAt: {
              $gte: yesterday,
            },
          })
          .sort({ _id: -1 })
          .then((newUser) => {
            MODEL.userModel
              .find({
                roles: "client",
                verified: true,
                $or: [
                  {
                    last_logged_in: {
                      $gte: active_today,
                    },
                  },
                  {
                    createAt: {
                      $gte: active_today,
                    },
                  },
                ],
              })
              .sort({ _id: -1 })
              .then((activeTodayUser) => {
                MODEL.userModel
                  .find({
                    verified: true,
                    roles: "client",
                    $or: [
                      {
                        last_logged_in: {
                          $lte: active_today,
                        },
                      },
                      {
                        last_logged_in: {
                          $exists: false,
                          $eq: null,
                        },
                      },
                    ],
                  })
                  .sort({ _id: -1 })
                  .then((InactiveUser) => {
                    return res.status(200).json({
                      allUsers: { allUsers: allUser.length },
                      newUsers: { newUsers: newUser.length },
                      activeTodayUsers: {
                        activeTodayUsers: activeTodayUser.length,
                      },
                      inactiveUsers: { inactiveUsers: InactiveUser.length },
                    });
                  });
              });
          });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.totalSalesAdvert = (req, res) => {
  try {
    MODEL.advertModel.find({}).then((adverts) => {
      return res.status(200).json({
        totalSalesAdvert: adverts.length,
      });
    });
  } catch (err) {
    return res.status(200).json(err);
  }
};

userController.usageGrowth = (req, res) => {
  var year = new Date().getFullYear();
  console.log("<<<Year>>>", year);

  try {
    MODEL.userModel
      .find({
        verified: true,
        $expr: {
          $and: [
            { $eq: [{ $year: "$createAt" }, year] },
            { $eq: [{ $month: "$createAt" }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.userModel
          .find({
            verified: true,
            $expr: {
              $and: [
                { $eq: [{ $year: "$createAt" }, year] },
                { $eq: [{ $month: "$createAt" }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.userModel
              .find({
                verified: true,
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createAt" }, year] },
                    { $eq: [{ $month: "$createAt" }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.userModel
                  .find({
                    verified: true,
                    $expr: {
                      $and: [
                        { $eq: [{ $year: "$createAt" }, year] },
                        { $eq: [{ $month: "$createAt" }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.userModel
                      .find({
                        verified: true,
                        $expr: {
                          $and: [
                            { $eq: [{ $year: "$createAt" }, year] },
                            { $eq: [{ $month: "$createAt" }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.userModel
                          .find({
                            verified: true,
                            $expr: {
                              $and: [
                                { $eq: [{ $year: "$createAt" }, year] },
                                { $eq: [{ $month: "$createAt" }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.userModel
                              .find({
                                verified: true,
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: "$createAt" }, year] },
                                    { $eq: [{ $month: "$createAt" }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.userModel
                                  .find({
                                    verified: true,
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: "$createAt" }, year] },
                                        { $eq: [{ $month: "$createAt" }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.userModel
                                      .find({
                                        verified: true,
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: "$createAt" },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: "$createAt" }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.userModel
                                          .find({
                                            verified: true,
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: "$createAt" },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: "$createAt" },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.userModel
                                              .find({
                                                verified: true,
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: "$createAt" },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: "$createAt" },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.userModel
                                                  .find({
                                                    verified: true,
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                "$createAt",
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                "$createAt",
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.userModel
                                                      .find({
                                                        verified: true,
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    "$createAt",
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    "$createAt",
                                                                },
                                                                11,
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      })
                                                      .then((Analytics) => {
                                                        res.status(200).json({
                                                          JANUARY: jan.length,
                                                          FEBRUARY: feb.length,
                                                          MARCH: march.length,
                                                          APRIL: april.length,
                                                          MAY: may.length,
                                                          JUNE: june.length,
                                                          JULY: july.length,
                                                          AUGUST: Aug.length,
                                                          SEPTEMBER:
                                                            sept.length,
                                                          OCTOBER: Oct.length,
                                                          NOVEMBER: Nov.length,
                                                          DECEMBER: Dec.length,
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

userController.mobileCarrierAnalytics = (REQUEST, RESPONSE) => {
  try {
    MODEL.userModel
      .find({
        verified: true,
        mobile_carrier: "MTN Nigeria",
      })
      .then((mtn) => {
        MODEL.collectorModel
          .find({
            verified: true,
            mobile_carrier: "MTN Nigeria",
          })
          .then((recycler_mtn) => {
            var mtn_users = [...mtn, ...recycler_mtn];
            MODEL.userModel
              .find({
                verified: true,
                mobile_carrier: "Airtel Nigeria",
              })
              .then((airtel) => {
                MODEL.collectorModel
                  .find({
                    verified: true,
                    mobile_carrier: "Airtel Nigeria",
                  })
                  .then((recycler_airtel) => {
                    var airtel_users = [...airtel, ...recycler_airtel];
                    MODEL.userModel
                      .find({
                        verified: true,
                        mobile_carrier: "GLO Nigeria",
                      })
                      .then((glo) => {
                        MODEL.collectorModel
                          .find({
                            verified: true,
                            mobile_carrier: "GLO Nigeria",
                          })
                          .then((recycler_glo) => {
                            var glo_users = [...glo, ...recycler_glo];
                            MODEL.userModel
                              .find({
                                verified: true,
                                mobile_carrier: "9Mobile",
                              })
                              .then((etisalat) => {
                                MODEL.collectorModel
                                  .find({
                                    verified: true,
                                    mobile_carrier: "9Mobile",
                                  })
                                  .then((recycler_etisalat) => {
                                    var etisalat_users = [
                                      ...etisalat,
                                      ...recycler_etisalat,
                                    ];
                                    return RESPONSE.status(200).json({
                                      MTN: {
                                        amount: mtn_users.length,
                                        data: mtn_users,
                                      },
                                      AIRTEL: {
                                        amount: airtel_users.length,
                                        data: airtel_users,
                                      },
                                      GLO: {
                                        amount: glo_users.length,
                                        data: glo_users,
                                      },
                                      ETISALAT: {
                                        amount: etisalat_users.length,
                                        data: etisalat_users,
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
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

userController.monthFiltering = (req, res) => {
  var year = new Date().getFullYear();

  try {
    MODEL.userModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: "$createAt" }, year] },
            { $eq: [{ $month: "$createAt" }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.userModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: "$createAt" }, year] },
                { $eq: [{ $month: "$createAt" }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.userModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: "$createAt" }, year] },
                    { $eq: [{ $month: "$createAt" }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.userModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: "$createAt" }, year] },
                        { $eq: [{ $month: "$createAt" }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.userModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: "$createAt" }, year] },
                            { $eq: [{ $month: "$createAt" }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.userModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: "$createAt" }, year] },
                                { $eq: [{ $month: "$createAt" }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.userModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: "$createAt" }, year] },
                                    { $eq: [{ $month: "$createAt" }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.userModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: "$createAt" }, year] },
                                        { $eq: [{ $month: "$createAt" }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.userModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: "$createAt" },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: "$createAt" }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.userModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: "$createAt" },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: "$createAt" },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.userModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: "$createAt" },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: "$createAt" },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.userModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                "$createAt",
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                "$createAt",
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.userModel
                                                      .find({
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    "$createAt",
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    "$createAt",
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

userController.userReportLog = (req, res) => {
  try {
    MODEL.reportLogModel.find({}).then((logs) => {
      return res.status(200).json(logs);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.internet_providerAnalytics = (req, res) => {
  try {
    MODEL.userModel
      .find({
        verified: true,
        $or: [
          {
            internet_provider: "MTN NG",
          },
          {
            internet_provider: "MTN",
          },
          {
            internet_provider: "STAY SAFE",
          },
          {
            internet_provider: "Stay Safe",
          },
        ],
      })
      .then((mtn) => {
        MODEL.collectorModel
          .find({
            verified: true,
            $or: [
              {
                internet_provider: "MTN NG",
              },
              {
                internet_provider: "MTN",
              },
              {
                internet_provider: "STAY SAFE",
              },
              {
                internet_provider: "Stay Safe",
              },
            ],
          })
          .then((recycler_mtn) => {
            var mtn_users = [...mtn, ...recycler_mtn];
            MODEL.userModel
              .find({
                verified: true,
                $or: [
                  {
                    internet_provider: "Airtel NG",
                  },
                  {
                    internet_provider: "Airtel",
                  },
                  {
                    internet_provider: "BeSafe Airtel",
                  },
                ],
              })
              .then((airtel) => {
                MODEL.collectorModel
                  .find({
                    verified: true,
                    $or: [
                      {
                        internet_provider: "Airtel NG",
                      },
                      {
                        internet_provider: "Airtel",
                      },
                      {
                        internet_provider: "BeSafe Airtel",
                      },
                    ],
                  })
                  .then((recycler_airtel) => {
                    var airtel_users = [...airtel, ...recycler_airtel];
                    MODEL.userModel
                      .find({
                        verified: true,
                        $or: [
                          {
                            internet_provider: "Glo NG",
                          },
                          {
                            internet_provider: "glo ng",
                          },
                        ],
                      })
                      .then((glo) => {
                        MODEL.collectorModel
                          .find({
                            verified: true,
                            $or: [
                              {
                                internet_provider: "Glo NG",
                              },
                              {
                                internet_provider: "glo ng",
                              },
                            ],
                          })
                          .then((recycler_glo) => {
                            var glo_users = [...glo, ...recycler_glo];
                            MODEL.userModel
                              .find({
                                verified: true,
                                $or: [
                                  {
                                    internet_provider: "9mobile",
                                  },
                                  {
                                    internet_provider: "9Mobile",
                                  },
                                ],
                              })
                              .then((etisalat) => {
                                MODEL.collectorModel
                                  .find({
                                    verified: true,
                                    $or: [
                                      {
                                        internet_provider: "9mobile",
                                      },
                                      {
                                        internet_provider: "9Mobile",
                                      },
                                    ],
                                  })
                                  .then((recycler_etisalat) => {
                                    var etisalat_users = [
                                      ...etisalat,
                                      ...recycler_etisalat,
                                    ];
                                    return res.status(200).json({
                                      MTN: {
                                        amount: mtn_users.length,
                                        data: mtn_users,
                                      },
                                      AIRTEL: {
                                        amount: airtel_users.length,
                                        data: airtel_users,
                                      },
                                      GLO: {
                                        amount: glo_users.length,
                                        data: glo_users,
                                      },
                                      ETISALAT: {
                                        amount: etisalat_users.length,
                                        data: etisalat_users,
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
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.triggerActivity = (req, res) => {
  const user = req.body.email;

  try {
    MODEL.userModel.updateOne(
      { email: user },
      { last_logged_in: new Date() },
      (resp) => {
        return res.status(200).json({
          message: "Activity triggered",
        });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.sendPushNotification = (req, res) => {
  const lga = req.body.lga;
  const messages = req.body.messages;
  const category = req.body.category || "";
  const phone = req.body.phone || "";

  //users , recyclers , companies , phone specific
  try {
    if (phone) {
      MODEL.userModel
        .findOne({
          phone: phone,
        })
        .then((user) => {
          var message = {
            app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
            contents: {
              en: `${messages}`,
            },
            include_player_ids: [`${user.onesignal_id}`],
          };
          sendNotification(message);
          return res.status(200).json({
            message: "Notification sent!",
          });
        });
    }
    if (category === "users") {
      MODEL.userModel
        .find({
          lcd: lga,
        })
        .then((users) => {
          const signals = [];
          for (let i = 0; i < users.length; i++) {
            signals.push(users[i].onesignal_id);
            const ids = [...new Set(users[i].onesignal_id)];
            var signalled = [...new Set(signals)];
          }

          for (let i = 0; i < signalled.length; i++) {
            async function sender() {
              var message = {
                app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                contents: {
                  en: `${messages}`,
                },
                include_player_ids: [`${users[i].onesignal_id}`],
              };
              return sendNotification(message);
            }
            sender();
          }
          return res.status(200).json({
            message: "Notification sent!",
          });
        });
    } else if (category === "recyclers") {
      MODEL.collectorModel
        .find({
          lcd: lga,
        })
        .then((recyclers) => {
          for (let i = 0; i < recyclers.length; i++) {
            var message = {
              app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
              contents: {
                en: `${messages}`,
              },
              include_player_ids: [`${recyclers[i].onesignal_id}`],
            };
            sendNotification(message);
          }
          return res.status(200).json({
            message: "Notification sent!",
          });
        });
    } else if (category === "companies") {
      MODEL.organisationModel
        .find({
          lcd: lga,
        })
        .then((companies) => {
          // Companies don't have one signal ids yet
          return res.status(200).json({
            message: "Notification sent!",
          });
        });
    }
  } catch (err) {
    return res.status(500).json(err);
  }
};

userController.userInactivity = (req, res) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setHours(yesterday.getHours() + 1);

  const active_today = new Date();
  active_today.setHours(0, 0, 0, 0);

  active_today.setHours(0, 0, 0, 0);
  active_today.setHours(active_today.getHours() + 1);

  console.log(">><<", active_today);

  $or: [
    {
      internet_provider: "Glo NG",
    },
    {
      internet_provider: "glo ng",
    },
  ];

  try {
    MODEL.userModel
      .find({
        verified: true,
        roles: "client",
        last_logged_in: {
          $lte: active_today,
        },
      })
      .sort({ _id: -1 })
      .then((InactiveUser) => {
        console.log(InactiveUser.length);
        return res.status(200).json({
          inactiveUsers: InactiveUser,
        });
      });
  } catch (err) {}
};

userController.updateOneSignal = (REQUEST, RESPONSE) => {
  const phone = REQUEST.body.phone;
  const renewedSignal = REQUEST.body.renewedSignal;
  try {
    MODEL.userModel
      .findOne({
        phone: phone,
      })
      .then((user) => {
        MODEL.userModel.updateOne(
          { email: user.email },
          {
            $set: {
              onesignal_id: renewedSignal,
            },
          },
          (res) => {
            return RESPONSE.status(200).json({
              message: "Signal ID updated successfully",
            });
          }
        );
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

userController.totalGender = async (REQUEST, RESPONSE) => {
  try {
    const totalMales = await MODEL.userModel
      .find({
        gender: "male",
      })
      .countDocuments();
    const totalFemales = await MODEL.userModel
      .find({
        gender: "female",
      })
      .countDocuments();
    return RESPONSE.status(200).json({
      message: "Total users",
      data: {
        male: totalMales,
        female: totalFemales,
      },
    });
  } catch (error) {
    console.log("error", error);
    return RESPONSE.status(500).json(error);
  }
};

userController.uploadResume = async (req, res) => {
  bodyValidate(req, res);
  SERVICE.resumeUpload(req, res).then((result) => {
    return RESPONSE.jsonp({ status: true, message: result });
  });
  // const firstname = REQUEST.body.firstname;
  // const lastname = REQUEST.body.lastname;
  // const resume = REQUEST.file;
  // console.log("resume", resume);
};

userController.loginUserV2 = async (req, res) => {
  bodyValidate(req, res);
  try {
    const user = await MODEL.userModel.findOne({
      phone: req.body.phone,
    });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid credentials",
        statusCode: 400,
      });
    }

    if (!(await COMMON_FUN.comparePassword(req.body.password, user.password))) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    await MODEL.userModel.updateOne(
      { _id: user._id },
      { last_logged_in: new Date() }
    );
    const token = COMMON_FUN.authToken(user);
    delete user.password;
    return res.status(200).json({
      error: false,
      message: "Login successfull",
      statusCode: 200,
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        othernames: user.othernames,
        address: user.address,
        roles: user.roles,
        countryCode: user.countryCode,
        verified: user.verified,
        availablePoints: user.availablePoints,
        rafflePoints: user.rafflePoints,
        schedulePoints: user.schedulePoints,
        cardID: user.cardID,
        lcd: user.lcd,
        last_logged_in: user.last_logged_in,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      statusCode: 500,
    });
  }
};

userController.adminLogin = async (req, res) => {
  bodyValidate(req, res);
  const email = req.body.email;
  try {
    const user = await MODEL.userModel.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    if (user.role === "client") {
      return res.status(400).json({
        error: true,
        message: "Unauthorized",
        statusCode: 401,
      });
    }

    if (!(await COMMON_FUN.comparePassword(req.body.password, user.password))) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    await MODEL.userModel.updateOne(
      { _id: user._id },
      { last_logged_in: new Date() }
    );
    const token = COMMON_FUN.authToken(user);
    delete user.password;
    return res.status(200).json({
      error: false,
      message: "Login successfull",
      statusCode: 200,
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        othernames: user.othernames,
        address: user.address,
        roles: user.roles,
        displayRole: user.displayRole,
        countryCode: user.countryCode,
        verified: user.verified,
        availablePoints: user.availablePoints,
        rafflePoints: user.rafflePoints,
        schedulePoints: user.schedulePoints,
        cardID: user.cardID,
        lcd: user.lcd,
        last_logged_in: user.last_logged_in,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      statusCode: 500,
    });
  }
};
/* export userControllers */
module.exports = userController;
