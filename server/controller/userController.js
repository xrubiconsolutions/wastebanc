'use strict';

/**************************************************
 ***** User controller for user business logic ****
 **************************************************/
let userController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
// const { Response } = require('aws-sdk');
var request = require('request');
const streamifier = require('streamifier');

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const fileUpload = multer();

cloudinary.config({
  cloud_name: 'pakam',
  api_key: '865366333135586',
  api_secret: 'ONCON8EsT1bNyhCGlXLJwH2lsy8',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Pakam',
  },
});


const parser = multer({ storage: storage });

var nodemailer = require('nodemailer');

const io = require('socket.io')();

io.on('connection', (client) => {
  client.on('subscribeToTimer', (interval) => {
    console.log('client is subscribing to event ', interval);
    // setInterval(() => {
    //   client.emit('timer', new Date());
    // }, interval);
  });
});

const tax_url =
  'https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer';

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pakambusiness@gmail.com',
    pass: 'pakambusiness-2000',
  },
});


var sendNotification = function (data) {
  
  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  var options = {
    host: 'onesignal.com',
    port: 443,
    path: '/api/v1/notifications',
    method: 'POST',
    headers: headers,
  };

  var https = require('https');
  var req = https.request(options, function (res) {
    res.on('data', function (data) {
      console.log('Response:');
      console.log(JSON.parse(data));
    });
  });

  req.on('error', function (e) {
    console.log('ERROR:');
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
            errors.message = 'User already exists';
            RESPONSE.status(400).jsonp(errors);
          } else {
            MODEL.userModel(dataToSave).save({}, (ERR, RESULT) => {
              if (ERR) RESPONSE.status(400).jsonp(ERR);
              else {
                request(
                  {
                    url:
                      'https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent',
                    method: 'POST',
                    json: true,
                    body: {
                      data: { username: 'xrubicon', password: 'xrubicon1234' },
                    },
                  },
                  function (error, response, body) {
                    //  return response.headers.token;
                    request(
                      {
                        url:
                          'https://apis.touchandpay.me/lawma-backend/v1/agent/create/customer',
                        method: 'POST',
                        headers: {
                          Accept: 'application/json',
                          'Accept-Charset': 'utf-8',
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

                        const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
                        const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
                        const client = require('twilio')(accountSid, authToken);

                        client.verify
                          .services('VAeaa492de9598c3dcce55fd9243461ab3')
                          .verifications.create({
                            to: `+234${dataToSave.phone}`,
                            channel: 'sms',
                          })
                          .then((verification) =>
                            console.log(verification.status)
                          );

                        client.lookups
                          .phoneNumbers(`+234${dataToSave.phone}`)
                          .fetch({ type: ['carrier'] })
                          .then((phone_number) =>
                            MODEL.userModel.updateOne(
                              { email: RESULT.email },
                              {
                                $set: {
                                  cardID: card_id,
                                  firstname: RESULT.username.split(' ')[0],
                                  lastname: RESULT.username.split(' ')[1],
                                  fullname: RESULT.username.split(' ')[0] + " " + RESULT.username.split(' ')[1],
                                  mobile_carrier: phone_number.carrier.name,
                                },
                              },
                              (res) => {
                                //BYPASS FOR TESTING PURPOSE
                                MODEL.userModel.findOne(
                                  { email: RESULT.email },
                                  (err, USER) => {
                                    var test = JSON.parse(JSON.stringify(USER));

                                    if (err)
                                      return RESPONSE.status(400).jsonp(error);
                                    console.log('user here at all', USER);
                                    var jwtToken = COMMON_FUN.createToken(
                                      test
                                    ); /** creating jwt token */
                                    console.log('user token here at all', USER);
                                    test.token = jwtToken;
                                    return RESPONSE.status(200).jsonp(
                                      COMMON_FUN.sendSuccess(
                                        CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                                        test
                                      )
                                    );
                                  }
                                );

                                console.log(res);
                              }
                            )
                          );
                      }
                    );
                  }
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
      $or: [{ phone: REQUEST.body.phone }, { email: REQUEST.body.email }],
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

                MODEL.userModel.updateOne(
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
            message: 'Invalid phone number',
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
    from: 'pakambusiness@gmail.com',
    to: `${REQUEST.body.email}`,
    subject: 'FORGOT PASSWORD MAIL',
    text: 'Forgot password?',
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
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

    console.log('<<<<<>>>>', checkUserExist);
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

  const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  const client = require('twilio')(accountSid, authToken);

  try {
    client.verify
      .services('VAeaa492de9598c3dcce55fd9243461ab3	')
      .verifications.create({
        to: `+234${phone}`,
        channel: 'sms',
      })
      .then((verification) => {
        console.log(verification.status);
        return RESPONSE.status(200).jsonp({
          message: 'Verification code sent',
        });
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
  const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  const client = require('twilio')(accountSid, authToken);

  try {
    client.verify
      .services('VAeaa492de9598c3dcce55fd9243461ab3')
      .verificationChecks.create({
        to: `+234${phone}`,
        code: `${token}`,
      })
      .then((verification_check) => {
        if (verification_check.status == 'approved') {
          console.log(verification_check.status);
          MODEL.userModel.updateOne(
            { phone: phone },
            { verified: true },
            (res) => {
              MODEL.userModel.findOne({ phone: phone }, (err, USER) => {
                var test = JSON.parse(JSON.stringify(USER));

                if (err) return RESPONSE.status(400).jsonp(error);
                console.log('user here at all', USER);
                var jwtToken = COMMON_FUN.createToken(
                  test
                ); /** creating jwt token */
                console.log('user token here at all', test, jwtToken);
                test.token = jwtToken;
                return RESPONSE.status(200).json(test);
              });
            }
          );
        } else {
          return RESPONSE.status(404).json({
            message: 'Wrong OTP !',
          });
        }
      })
      .catch((err) =>
        RESPONSE.status(404).json({
          message: 'Wrong OTP !',
        })
      );
  } catch (err) {
    return RESPONSE.status(404).json({
      err,
    });
  }
};

userController.getAllClients = async (REQUEST, RESPONSE) => {
  try {
    /* check user exist or not*/
    let users = await MODEL.userModel.find({ roles: 'client' }).sort({ _id : -1});
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.status(400).jsonp(err);
  }
};

userController.getWalletBalance = (req, res) => {
  request(
    {
      url: 'https://apis.touchandpay.me/lawma-backend/v1/agent/login/agent',
      method: 'POST',
      json: true,
      body: { data: { username: 'xrubicon', password: 'xrubicon1234' } },
    },
    function (error, response, body) {
      response.headers.token;

      request(
        {
          url: `https://apis.touchandpay.me/lawma-backend/v1/agent/get/customer/card/${req.query.cardID}`,
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Accept-Charset': 'utf-8',
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
    let users = await MODEL.collectorModel.find({}).sort({_id:-1});
    RESPONSE.jsonp(users);
  } catch (err) {
    RESPONSE.status(400).jsonp(err);
  }
};

userController.resetMobile = (REQUEST, RESPONSE) => {
  const phone = REQUEST.body.phone;
  const token = REQUEST.body.token;

  const accountSid = 'AC21bbc8152a9b9d981d6c86995d0bb806';
  const authToken = '3c53aeab8e3420f00e7b05777e7413a9';
  const client = require('twilio')(accountSid, authToken);

  client.verify
    .services('VAeaa492de9598c3dcce55fd9243461ab3	')
    .verificationChecks.create({
      to: `+234${phone}`,
      code: `${token}`,
    })
    .then((verification_check) => {
      if (verification_check.status == 'approved') {
        RESPONSE.status(200).json({
          message: ' Verification successful ',
        });
      }
    })
    .catch((err) => RESPONSE.status(404).jsonp(err));
};

userController.resetMobilePassword = (REQUEST, RESPONSE) => {
  const phone = REQUEST.body.phone;
  MODEL.userModel.findOne({ phone: phone }).then((result) => {
    if (!result) {
      return RESPONSE.status(400).json({
        message: ' This account is not verified ',
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
  active_today.setDate(today.getDate() - 1);
  try {
    MODEL.userModel
      .find({
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
  const advert = { ...req.body}
  
  try{
  
    MODEL.advertModel(advert).save({}, (ERR, RESULT) => {
  
        return res.status(200).json({
          message: "Advert Posted Successfully"
        })
  
    })
  }
  catch(err){
    return res.status(500).json(err)
  }
}

userController.updateAdvert = (req, res) => {
  const advert = { ...req.body}
  
  try{

    MODEL.advertModel.updateOne(
      { _id: req.body._id },
      {
        $set: {
          title: req.body.title,
          advert_url: req.body.advert_url,
          duration : req.body.duration,
          start_date:req.body.start_date,
          thumbnail_url:req.body.thumbnail_url
      }
        },
      (res) => { return res.status(200).json({
        message: "Advert Updated Successfully"
      }) })
  
  }
  catch(err){
    return res.status(500).json(err)
  }
}


userController.adsLook = (req, res) => {
  MODEL.advertModel.find({}).then((advert) => {
    return res.status(200).json(advert);
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
        console.log('Logged date updated', new Date());
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
              internet_provider: REQUEST.body.internet_provider
            },
          }
        )
        .then((SUCCESS) => {
          MODEL.userModel
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

userController.androidUsers = (req, res) => {
  try {
    MODEL.userModel
      .find({
        phone_OS: 'android',
      })
        .then((result) => {
      
          MODEL.collectorModel.find({phone_OS:"android"}).then(recycler=>{
            var data = [...result, ...recycler]
            return res.status(200).json({
           data: data
  });
  
  }   )
        })   
      } catch (err) {
    res.status(500).json(err);
  }
};



userController.iosUsers = (req, res) => {
  try {
    MODEL.userModel
      .find({
        phone_OS: 'ios',
      })
      .then((result) => {

        MODEL.collectorModel.find({phone_OS:"ios"}).then(recycler=>{
          var data = [...result, ...recycler]
          return res.status(200).json({
         data: data
});

}   )
      })   
  } catch (err) {
    res.status(500).json(err);
  }
};



userController.desktopUsers = (req, resp) => {

  try {
    request(
      {
        url:
          'https://pakam-business.herokuapp.com/api/getAllClients',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Charset': 'utf-8',
        },
      },
      function (err, res){
       return resp.status(200).json(JSON.parse(res.body))
       })
  } catch (err) {
    return resp.status(500).json(err);
  }
};



userController.deviceAnalytics  = (req,res)=>{

  try {
    MODEL.userModel
    .find({
      phone_OS: 'android',
    })
    .then((android) => {

      MODEL.userModel.find({
        phone_OS: "ios"
      }).then((ios)=>{

        request(
          {
            url:
              'https://pakam-business.herokuapp.com/api/getAllClients',
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Accept-Charset': 'utf-8',
            },
          },
          function (err, resp){
            var desktop = JSON.parse(resp.body);
            return res.status(200).json({
              android: android.length,
              ios: ios.length,
              desktop: desktop.length
            })

        })

      })
    });
} catch (err) {
  res.status(500).json(err);
}
  
}

userController.deleteUser = (req,res)=>{

  const userID = req.body.userID
  try {

    MODEL.userModel.deleteOne({
      _id: userID
    }).then((result)=>{
      return res.status(200).json({
        message: "User deleted successfully"
      })
    })

  }
  catch(err){
    return res.status(500).json(err)
  }
   

}


userController.userAnalytics = (req,res)=>{
  const today = new Date();
  const active_today = new Date();

  try {
  MODEL.userModel.find({
  }).then((allUser)=>{
  active_today.setDate(today.getDate() - 1);
    MODEL.userModel
      .find({
         createAt: {
          $gte: active_today,
        },
      })
      .sort({ _id: -1 })
      .then((newUser) => {

          MODEL.userModel
            .find({
              last_logged_in: {
                $gte: active_today,
              },
            })
            .sort({ _id: -1 })
            .then((activeTodayUser) => {

              MODEL.userModel.find({
                last_logged_in: {
                  $lte: active_today,
                }
              }).sort({ _id : -1}).then((InactiveUser)=>{

                return res.status(200).json({
                  allUsers: {amount: allUser.length, allUsers: allUser },
                  newUsers: { amount: newUser.length, newUsers: newUser },
                  activeTodayUsers: { amount : activeTodayUser.length, activeTodayUsers : activeTodayUser},
                  inactiveUsers: { amount: allUser.length-activeTodayUser.length , inactiveUsers : InactiveUser }
                })
             })

                 


            })
  

     
      })



  })
} catch(err){
  return res.status(500).json(err)
}
}


userController.totalSalesAdvert = (req,res)=>{
  try{

    MODEL.advertModel.find({}).then((adverts)=>{
      return res.status(200).json({
        totalSalesAdvert: adverts.length
      })
    })

  }catch(err){

    return res.status(200).json(err)

  }
}


userController.usageGrowth = (req,res)=>{

  var year = new Date().getFullYear()
  console.log("<<<Year>>>", year)



  try{

    MODEL.userModel.find({
      "$expr": {
        "$and": [
          {"$eq": [{ "$year": "$createAt" }, year]},
          {"$eq": [{ "$month": "$createAt" }, 1]}
        ]
      }
    }).then((jan) => {
      MODEL.userModel.find({
        "$expr": {
          "$and": [
            {"$eq": [{ "$year": "$createAt" }, year]},
            {"$eq": [{ "$month": "$createAt" }, 2]}
          ]
        }
      }).then((feb)=>{

        MODEL.userModel.find({
          "$expr": {
            "$and": [
              {"$eq": [{ "$year": "$createAt" }, year]},
              {"$eq": [{ "$month": "$createAt" }, 3]}
            ]
          }
        }).then((march)=>{

          MODEL.userModel.find({
            "$expr": {
              "$and": [
                {"$eq": [{ "$year": "$createAt" }, year]},
                {"$eq": [{ "$month": "$createAt" }, 4]}
              ]
            }
          }).then((april)=>{

            MODEL.userModel.find({
              "$expr": {
                "$and": [
                  {"$eq": [{ "$year": "$createAt" }, year]},
                  {"$eq": [{ "$month": "$createAt" }, 5]}
                ]
              }
            }).then((may)=>{

              MODEL.userModel.find({
                "$expr": {
                  "$and": [
                    {"$eq": [{ "$year": "$createAt" }, year]},
                    {"$eq": [{ "$month": "$createAt" }, 6]}
                  ]
                }
              }).then((june)=>{

                MODEL.userModel.find({
                  "$expr": {
                    "$and": [
                      {"$eq": [{ "$year": "$createAt" }, year]},
                      {"$eq": [{ "$month": "$createAt" }, 7]}
                    ]
                  }
                }).then((july)=>{

                  MODEL.userModel.find({
                    "$expr": {
                      "$and": [
                        {"$eq": [{ "$year": "$createAt" }, year]},
                        {"$eq": [{ "$month": "$createAt" }, 8]}
                      ]
                    }
                  }).then((Aug)=>{

                    MODEL.userModel.find({
                      "$expr": {
                        "$and": [
                          {"$eq": [{ "$year": "$createAt" }, year]},
                          {"$eq": [{ "$month": "$createAt" }, 9]}
                        ]
                      }
                    }).then((sept)=>{


                      MODEL.userModel.find({
                        "$expr": {
                          "$and": [
                            {"$eq": [{ "$year": "$createAt" }, year]},
                            {"$eq": [{ "$month": "$createAt" }, 10]}
                          ]
                        }
                      }).then((Oct)=>{

                        MODEL.userModel.find({
                          "$expr": {
                            "$and": [
                              {"$eq": [{ "$year": "$createAt" }, year]},
                              {"$eq": [{ "$month": "$createAt" }, 11]}
                            ]
                          }
                        }).then((Nov)=>{

                          MODEL.userModel.find({
                            "$expr": {
                              "$and": [
                                {"$eq": [{ "$year": "$createAt" }, year]},
                                {"$eq": [{ "$month": "$createAt" }, 12]}
                              ]
                            }
                          }).then((Dec)=>{

                            MODEL.userModel.find({
                              "$expr": {
                                "$and": [
                                  {"$eq": [{ "$year": "$createAt" }, year]},
                                  {"$eq": [{ "$month": "$createAt" }, 11]}
                                ]
                              }
                            }).then((Analytics)=>{
                              res.status(200).json({
                                JANUARY: jan.length,
                                FEBRUARY: feb.length,
                                MARCH: march.length,
                                APRIL: april.length,
                                MAY: may.length,
                                JUNE: june.length,
                                JULY: july.length,
                                AUGUST: Aug.length,
                                SEPTEMBER: sept.length,
                                OCTOBER: Oct.length,
                                NOVEMBER: Nov.length,
                                DECEMBER: Dec.length
                              })
                               

                            })


                          })

                        })

                      })

                    })

                  })

                })


              })

            })



          })


        })

      })


    });
  


  }
  catch(err){
    return res.status(500).json(err)

  }

}


userController.mobileCarrierAnalytics = (req,res)=>{
  try{
      MODEL.userModel.find({
        mobile_carrier: "MTN"
      }).then((mtn)=>{
          MODEL.collectorModel.find({
            mobile_carrier:"MTN"
          }).then((recycler_mtn)=>{
            var mtn_users = [...mtn, ...recycler_mtn];
              MODEL.userModel.find({
                mobile_carrier:"Airtel Nigeria"
              }).then((airtel)=>{
                  MODEL.collectorModel.find({
                    mobile_carrier:"Airtel Nigeria"
                  }).then((recycler_airtel)=>{
                    var airtel_users = [...airtel, ...recycler_airtel];
                      MODEL.userModel.find({
                        mobile_carrier:"Globacom (GLO)"
                      }).then((glo)=>{
                          MODEL.collectorModel.find({
                            mobile_carrier: "Globacom (GLO)"
                          }).then((recycler_glo)=>{
                              var glo_users = [...glo, ...recycler_glo];
                                MODEL.userModel.find({
                                  mobile_carrier:"9Mobile Nigeria (Etisalat)"
                                }).then((etisalat)=>{
                                    MODEL.collectorModel.find({
                                      mobile_carrier:"9Mobile Nigeria (Etisalat)"
                                    }).then((recycler_etisalat)=>{
                                        var etisalat_users = [...etisalat, ...recycler_etisalat];
                                         return res.status(200).json({
                                           MTN: { amount: mtn_users.length, data : mtn_users },
                                           AIRTEL: { amount:  airtel_users.length, data : airtel_users  },
                                           GLO: { amount: glo_users.length, data: glo_users },
                                           ETISALAT:{amount: etisalat_users.length , data: etisalat_users }
                                         })
                                    })
                                })
                          })
                      })
                  })
              })
          })
      })
  } catch(err){
    return res.status(500).json(err);
  }
}


userController.monthFiltering = (req,res)=>{

  var year = new Date().getFullYear()

  try{

    MODEL.userModel.find({
      "$expr": {
        "$and": [
          {"$eq": [{ "$year": "$createAt" }, year]},
          {"$eq": [{ "$month": "$createAt" }, 1]}
        ]
      }
    }).then((jan) => {
      MODEL.userModel.find({
        "$expr": {
          "$and": [
            {"$eq": [{ "$year": "$createAt" }, year]},
            {"$eq": [{ "$month": "$createAt" }, 2]}
          ]
        }
      }).then((feb)=>{

        MODEL.userModel.find({
          "$expr": {
            "$and": [
              {"$eq": [{ "$year": "$createAt" }, year]},
              {"$eq": [{ "$month": "$createAt" }, 3]}
            ]
          }
        }).then((march)=>{

          MODEL.userModel.find({
            "$expr": {
              "$and": [
                {"$eq": [{ "$year": "$createAt" }, year]},
                {"$eq": [{ "$month": "$createAt" }, 4]}
              ]
            }
          }).then((april)=>{

            MODEL.userModel.find({
              "$expr": {
                "$and": [
                  {"$eq": [{ "$year": "$createAt" }, year]},
                  {"$eq": [{ "$month": "$createAt" }, 5]}
                ]
              }
            }).then((may)=>{

              MODEL.userModel.find({
                "$expr": {
                  "$and": [
                    {"$eq": [{ "$year": "$createAt" }, year]},
                    {"$eq": [{ "$month": "$createAt" }, 6]}
                  ]
                }
              }).then((june)=>{

                MODEL.userModel.find({
                  "$expr": {
                    "$and": [
                      {"$eq": [{ "$year": "$createAt" }, year]},
                      {"$eq": [{ "$month": "$createAt" }, 7]}
                    ]
                  }
                }).then((july)=>{

                  MODEL.userModel.find({
                    "$expr": {
                      "$and": [
                        {"$eq": [{ "$year": "$createAt" }, year]},
                        {"$eq": [{ "$month": "$createAt" }, 8]}
                      ]
                    }
                  }).then((Aug)=>{

                    MODEL.userModel.find({
                      "$expr": {
                        "$and": [
                          {"$eq": [{ "$year": "$createAt" }, year]},
                          {"$eq": [{ "$month": "$createAt" }, 9]}
                        ]
                      }
                    }).then((sept)=>{


                      MODEL.userModel.find({
                        "$expr": {
                          "$and": [
                            {"$eq": [{ "$year": "$createAt" }, year]},
                            {"$eq": [{ "$month": "$createAt" }, 10]}
                          ]
                        }
                      }).then((Oct)=>{

                        MODEL.userModel.find({
                          "$expr": {
                            "$and": [
                              {"$eq": [{ "$year": "$createAt" }, year]},
                              {"$eq": [{ "$month": "$createAt" }, 11]}
                            ]
                          }
                        }).then((Nov)=>{

                          MODEL.userModel.find({
                            "$expr": {
                              "$and": [
                                {"$eq": [{ "$year": "$createAt" }, year]},
                                {"$eq": [{ "$month": "$createAt" }, 12]}
                              ]
                            }
                          }).then((Dec)=>{

                            MODEL.userModel.find({
                              "$expr": {
                                "$and": [
                                  {"$eq": [{ "$year": "$createAt" }, year]},
                                  {"$eq": [{ "$month": "$createAt" }, 11]}
                                ]
                              }
                            }).then((Analytics)=>{
                              res.status(200).json({
                                JANUARY:{ amount: jan.length, data : jan },
                                FEBRUARY: { amount:feb.length, data:feb },
                                MARCH: { amount: march.length, data : march},
                                APRIL: { amount: april.length, data : april},
                                MAY: { amount: may.length, data: may },
                                JUNE: { amount:june.length, data: june },
                                JULY: { amount: july.length, data: july },
                                AUGUST: {amount: Aug.length, data: Aug },
                                SEPTEMBER: { amount: sept.length, data: sept},
                                OCTOBER:{amount: Oct.length, data: Oct},
                                NOVEMBER:{ amount: Nov.length, data: Nov},
                                DECEMBER: { amount: Dec.length, data : Dec}
                              })
                               

                            })


                          })

                        })

                      })

                    })

                  })

                })


              })

            })



          })


        })

      })


    });
  


  }
  catch(err){
    return res.status(500).json(err)

  }

}


userController.userReportLog = (req,res)=>{
  try{

    MODEL.reportLogModel.find({}).then((logs)=>{
      return res.status(200).json(logs)
    })

  }
  catch(err){
    return res.status(500).json(err)

  }
}

userController.internet_providerAnalytics = (req,res)=>{
  try{
      MODEL.userModel.find({
        internet_provider: "MTN NG"
      }).then((mtn)=>{
          MODEL.collectorModel.find({
            internet_provider:"MTN NG"
          }).then((recycler_mtn)=>{
            var mtn_users = [...mtn, ...recycler_mtn];
              MODEL.userModel.find({
                internet_provider:"Airtel NG"
              }).then((airtel)=>{
                  MODEL.collectorModel.find({
                    internet_provider:"Airtel NG"
                  }).then((recycler_airtel)=>{
                    var airtel_users = [...airtel, ...recycler_airtel];
                      MODEL.userModel.find({
                        internet_provider:"Glo LTE"
                      }).then((glo)=>{
                          MODEL.collectorModel.find({
                            internet_provider: "Glo LTE"
                          }).then((recycler_glo)=>{
                              var glo_users = [...glo, ...recycler_glo];
                                MODEL.userModel.find({
                                  internet_provider:"9Mobile Nigeria (Etisalat)"
                                }).then((etisalat)=>{
                                    MODEL.collectorModel.find({
                                      internet_provider:"9Mobile Nigeria (Etisalat)"
                                    }).then((recycler_etisalat)=>{
                                        var etisalat_users = [...etisalat, ...recycler_etisalat];
                                         return res.status(200).json({
                                           MTN: { amount: mtn_users.length, data : mtn_users },
                                           AIRTEL: { amount:  airtel_users.length, data : airtel_users  },
                                           GLO: { amount: glo_users.length, data: glo_users },
                                           ETISALAT:{amount: etisalat_users.length , data: etisalat_users }
                                         })
                                    })
                                })
                          })
                      })
                  })
              })
          })
      })
  } catch(err){
    return res.status(500).json(err);
  }
}


userController.triggerActivity = (req,res)=>{

  const user =  req.body.email 

  try {
    MODEL.userModel.updateOne(
      { email: user },
      { last_logged_in: new Date() },
      (resp) => {
        return res.status(200).json({
          message : "Activity triggered"
        })
      }
    );
    

  } catch(err){
    return res.status(500).json(err)
  }
 
}



userController.sendPushNotification = (req,res)=>{
  const lga = req.body.lga;
  const messages = req.body.messages;
  const category = req.body.category || "";
  const phone = req.body.phone || "";

  //users , recyclers , companies , phone specific
  try{

    if(phone){
      MODEL.userModel.findOne({
        phone : phone
      }).then((user)=>{
        var message = {
          app_id: '8d939dc2-59c5-4458-8106-1e6f6fbe392d',
          contents: {
            en: `${messages}`,
          },
          include_player_ids: [`${user.onesignal_id}`],
        };
        sendNotification(message);
        return res.status(200).json({
          message: "Notification sent!"
        })
      })
    }
    if(category === "users"){
      MODEL.userModel.find({
          lcd : lga
      }).then((users)=>{
        for(let i = 0 ; i < users.length ; i++){
         async function sender(){

            var message = {
              app_id: '8d939dc2-59c5-4458-8106-1e6f6fbe392d',
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
          message: "Notification sent!"
        })
      })
    }
    else if(category === "recyclers"){
        MODEL.collectorModel.find({
          lcd : lga
        }).then((recyclers)=>{
          for(let i = 0 ; i < recyclers.length ; i++){
            var message = {
              app_id: '8d939dc2-59c5-4458-8106-1e6f6fbe392d',
              contents: {
                en: `${messages}`,
              },
              include_player_ids: [`${recyclers[i].onesignal_id}`],
            };
            sendNotification(message);
          }
          return res.status(200).json({
            message: "Notification sent!"
          })
        })
    }

    else if (category === "companies"){
      MODEL.organisationModel.find({
        lcd: lga
      }).then((companies)=>{
        // Companies don't have one signal ids yet
          return res.status(200).json({
            message: "Notification sent!"
          })
      })

    }
  }
  catch(err){
    return res.status(500).json(err)
  }
}
/* export userControllers */
module.exports = userController;
