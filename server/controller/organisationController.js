'use strict';

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let organisationController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
let FS = require('fs');
const { Response } = require('aws-sdk');
var request = require('request');
const sgMail = require('@sendgrid/mail');

let auth = require('../util/auth');

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pakambusiness@gmail.com',
    pass: 'pakambusiness-2000',
  },
});

organisationController.createOrganisation = (req, RESPONSE) => {
  const organisation_data = { ...req.body };
  const errors = {};
  const password = COMMON_FUN.generateRandomString();

  try {
    COMMON_FUN.encryptPswrd(password, (ERR, PASSWORD) => {
      if (ERR) return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
      else {
        organisation_data.password = PASSWORD;
        var errors = {};
        MODEL.organisationModel
          .findOne({
            $or: [
              {
                email: organisation_data.email,
              },
              {
                companyName: organisation_data.companyName,
              },
            ],
          })
          .then((user) => {
            if (user) {
              errors.email = 'Company already exists';
              RESPONSE.status(400).jsonp(errors);
            } else {
              MODEL.organisationModel(organisation_data).save(
                {},
                (ERR, RESULT) => {
                  if (ERR) RESPONSE.status(400).jsonp(ERR);
                  else {
                    sgMail.setApiKey(
                      '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'
                    );
                    const msg = {
                      to: `${organisation_data.email}`,
                      from: 'pakam@xrubiconsolutions.com', // Use the email address or domain you verified above
                      subject: 'WELCOME TO PAKAM!!!',
                      text: `
Congratulations, you have been approved by Pakam and have been on-boarded to the Pakam waste management ecosystem.

Kindly use the following login details to sign in to your  Pakam Company Dashboard.


Email: ${organisation_data.email}

Password: ${password}

Please note you can reset the password after logging into the App by clicking on the image icon on the top right corner of the screen.

*Attached below is a guide on how to use the Company Dashboard.

How To Use The Dashboard
Kindly Logon to https://dashboard.pakam.ng

* Select Recycling Company
* Input your Login Details
* You can reset your password by clicking on the image icon at the top right of the screen.
* After Login you can see a data representation of all activities pertaining to your organisation such as:
Total Schedule Pickup: This is the sum total of the schedules within your jurisdiction, which include pending schedules, completed schedules, accepted schedules, cancelled schedules and missed schedules.

Total Waste Collected: This card display the data of all the waste collected by your organization so far. When you click on the card it shows you a data table representing the actual data of the waste collected by your organization and it's aggregators.

Total Payout: This card embodies the table that showcase details of user whose recyclables your organization have collected and how much you are meant to pay them.

Instruction of How To Onboard Collectors or Aggregators

* You will need to onboard your collectors or aggregators into the system by asking them to download the Pakam Recycler's App.
* Create a unique company ID No for your collector/aggregator.
* Instruct them to select the name of your organization and input unique company ID No while setting up their account.
* Once they choose your organization as their recycling company, you will need to approve them on your company Dashboard.

How To Approve a Collector/Aggregator
* Login  into your Company Dashboard
* Click on all aggregator on the side menu
* Click on all pending aggregator
* You will see a list of all pending aggregator and an approve button beside it. 
* Click on approve to Approve the aggregator
* Refresh the screen, pending aggregators who have been approved will populated under All Approved aggregators.

We wish you an awesome experience using the App waste management software.

Best Regards

Pakam Team
`,
                    };

                    //ES6
                    sgMail.send(msg).then(
                      () => {},
                      (error) => {
                        console.error(error);

                        if (error.response) {
                          console.error(error.response.body);
                        }
                      }
                    );

                    const areas = RESULT.areaOfAccess;

                    for (let j = 0; j < areas.length; j++) {
                      request.get(
                        {
                          url: `https://maps.googleapis.com/maps/api/geocode/json?address=${areas[j]}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`,
                        },
                        function (error, response, body) {
                          var result = JSON.parse(body);
                          var LatLong = result.results.map((area) => ({
                            formatted_address: area.formatted_address,
                            geometry: area.geometry,
                          }));
                          MODEL.geofenceModel({
                            organisationId: RESULT._id,
                            data: LatLong,
                          }).save({}, (err, result) => {
                            console.log(result);
                          });
                        }
                      );
                    }

                    return RESPONSE.status(200).json(RESULT);
                  }
                }
              );
            }
          });
      }
    });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

organisationController.changedlogedInPassword = (REQUEST, RESPONSE) => {
  let BODY = REQUEST.body;
  COMMON_FUN.encryptPswrd(BODY.newPassword, (ERR, HASH) => {
    console.log('>>', HASH);
  });
  COMMON_FUN.objProperties(REQUEST.body, (ERR, RESULT) => {
    if (ERR) {
      return RESPONSE.jsonp(COMMON_FUN.sendError(ERR));
    } else {
      MODEL.organisationModel
        .findOne({ email: REQUEST.body.username }, {}, { lean: true })
        .then((RESULT) => {
          if (!RESULT) {
            console.log(RESULT);
            return RESPONSE.jsonp(
              COMMON_FUN.sendError(CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND)
            );
          } else {
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
                      MODEL.organisationModel
                        .updateOne(
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

organisationController.loginOrganisation = (REQUEST, RESPONSE) => {
  var PROJECTION = { __v: 0, createAt: 0 };

  /** find user is exists or not */
  MODEL.organisationModel
    .findOne({ email: REQUEST.body.email }, PROJECTION, { lean: true })
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
                USER.token = jwtToken;
                if (USER.licence_active == false) {
                  return RESPONSE.status(400).json({
                    message:
                      'Your licence expired. Kindly contact support for difficulty in renewal',
                  });
                }
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

organisationController.listOrganisation = (req, res) => {
  let errors = {};

  MODEL.organisationModel
    .find({})
    .sort({ _id: -1 })
    .then((result) => {
      //  if (err) {
      //   errors.message = "There was an issue fetching the organisations"
      //   return res.status(400).jsonp(errors)
      //  }
      return res.status(200).jsonp(result);
    })
    .catch((err) => res.status(400).jsonp(err));
};

organisationController.agentApproval = (req, res) => {
  const agentID = req.body.agentID;
  const organisationID = req.body.organisationID;
  if (!organisationID) {
    return res
      .status(400)
      .jsonp({ message: "The recycler's ID and organisation ID is required" });
  }
  MODEL.collectorModel.updateOne(
    { _id: agentID },
    { verified: true, approvedBy: organisationID },
    (err, resp) => {
      if (err) {
        return res.status(400).jsonp(err);
      }
      console.log('approved by us');
      return res.jsonp({ message: 'You just approved a recycler' });
    }
  );
};

organisationController.agentDecline = (req, res) => {
  const agentID = req.body.agentID;

  MODEL.collectorModel.updateOne(
    { _id: agentID },
    { verified: false },
    (err, resp) => {
      if (err) {
        return res.status(400).jsonp(err);
      }
      return res.jsonp({ message: "You just declined a recycler's request " });
    }
  );
};

organisationController.organisationSchedules = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.scheduleModel
    .find({ organisationCollection: organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result);
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.approvedAgents = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.collectorModel
    .find({ approvedBy: organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result);
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.coinBank = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.transactionModel
    .find({ organisationID: organisationID })
    .sort({ _id: -1 })
    .then((recycler, err) => {
      console.log(recycler.coin);
      let totalCoin = recycler
        .map((val) => val.coin)
        .reduce((acc, curr) => acc + curr, 0);
      return res.status(200).json({
        totalCoinTransaction: totalCoin,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.wasteCounter = (req, res) => {
  const organisationID = req.query.organisationID;
  try {
    MODEL.transactionModel
      .find({ organisationID: organisationID })
      .sort({ _id: -1 })
      .then((recycler, err) => {
        let totalWeight = recycler
          .map((val) => val.weight)
          .reduce((acc, curr) => acc + curr);
        return res.status(200).json({
          totalWeight: totalWeight,
        });
      })
      .catch((err) => res.status(500).json(err));
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.numberTransaction = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.transactionModel
    .find({ organisationID: organisationID })
    .sort({ _id: -1 })
    .then((recycler, err) => {
      var len = recycler.length;
      return res.status(200).json({
        totalNumberOfTransactions: len,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.historyTransaction = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.transactionModel
    .find({ organisationID: organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data: result,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.totalSchedules = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.transactionModel
    .find({ organisationID: organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      var len = result.length;
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data: len,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.allRecyclers = (req, res) => {
  try {
    const page = parseInt(req.query.page);

    const PAGE_SIZE = 10;
    const skip = (page - 1) * PAGE_SIZE; // For page 1, the skip is: (1 - 1)

    MODEL.collectorModel
      .find({})
      .skip(skip)
      .limit(PAGE_SIZE)
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json(result);
      });
  } catch (e) {
    return res.status(500).json(e);
  }
};

organisationController.allUsers = (req, res) => {
  try {
    const page = parseInt(req.query.page);

    const PAGE_SIZE = 10;
    const skip = (page - 1) * PAGE_SIZE; // For page 1, the skip is: (1 - 1)

    MODEL.userModel
      .find({})
      .skip(skip)
      .limit(PAGE_SIZE)
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json(result);
      });
  } catch (e) {
    return res.status(500).json(e);
  }
};

organisationController.allPendingRecycler = (req, res) => {
  const organisation = req.query.organisation;

  if (!organisation)
    return res.status(400).json({
      message: 'Enter your organisation name !',
    });
  try {
    MODEL.collectorModel
      .find({
        organisation: organisation,
        approvedBy: { $eq: null },
      })
      .then((result, err) => {
        if (err)
          return res.status(400).json({
            message: 'No recycler found',
          });
        return res.status(200).json(result);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.payRecyclers = (req, res) => {
  const receipt = { ...req.body };

  try {
    MODEL.companyReceiptModel
      .findOne({ transaction_id: receipt.transaction_id })
      .then((result, err) => {
        if (result)
          return res.status(400).json({
            message: 'This transaction had already been saved on the database',
          });
        MODEL.companyReceiptModel(receipt).save({}, (ERR, RESULT) => {
          if (ERR) return res.status(400).json(ERR);

          if (receipt.paymentType === 'licence') {
            MODEL.organisationModel.updateOne(
              { email: receipt.customerMail },
              {
                $set: {
                  licence_active: true,
                },
              },
              (activated) => {
                console.log('<<activated>>');
              }
            );
          }

          return res.status(200).json(RESULT);
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.paymentLog = (req, res) => {
  const log = { ...req.body };

  try {
    MODEL.paymentLogModel
      .findOne({ receiptId: log.receiptId })
      .then((result, err) => {
        if (result)
          return res.status(400).json({
            message: 'This log had already been saved on the database',
          });

        MODEL.paymentLogModel(log).save({}, (ERR, RESULT) => {
          if (ERR) return res.status(400).json(ERR);

          return res.status(200).json(RESULT);
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.getAllTransactions = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.paymentLogModel
    .find({ companyId: organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data: result,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.monthChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);

  const organisationID = req.query.organisationID;
  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: 'completed',
      pickUpDate: {
        $gte: lastWeek,
        $lt: today,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'PetBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.thirdChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);
  const organisationID = req.query.organisationID;
  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: 'completed',
      pickUpDate: {
        $gte: forthWeek,
        $lt: lastWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.forthChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);

  const organisationID = req.query.organisationID;
  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: 'completed',
      pickUpDate: {
        $gte: thirdWeek,
        $lt: forthWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.weekChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);
  const organisationID = req.query.organisationID;
  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: 'completed',
      pickUpDate: {
        $gte: lastMonth,
        $lt: thirdWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      console.log('result here', result);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.raffleTicket = (req, res) => {
  const lcd = req.body.lcd;
  const winner_count = req.body.winner_count;
  try {
    var allUser = [];


    MODEL.userModel
          .aggregate([
            { $match: { schedulePoints: { $ne: 0 } } },
            { $sample: { size: Number(winner_count) } },
          ])
          .then((winners, err) => {
            if (err) return res.status(400).json(err);
            for (let i = 0; i < winners.length; i++) {
              MODEL.userModel.updateOne(
                { _id: winners[i]._id },
                { $set: { rafflePoints: winners[i].rafflePoints + 10000 } },
                (res) => {
                  console.log('Winner object update' , winners.length);
                }
              );
            }
            return res.status(200).json({ winners: winners });
          });
  

    // MODEL.scheduleModel.find({
    // }).then((schedule)=>{
    //   for(let i = 0 ; i < schedule.length ; i++){
    //       MODEL.userModel.findOne({
    //         phone : schedule[i].phone
    //       }).then((user)=>{
    //           allUser.push(user);
    //       })
    //       console.log(allUser)
    //   }
    // })


    // MODEL.scheduleModel
    // .find({
    //   completionStatus: "completed"
    // })
    // .sort({ _id: -1 })
    // .then((schedules) => {
    //   schedules.forEach((schedule, index) => {
    //     (function raffle() {
    //         for (let j = 0; j < schedules.length; j++) {
    //             for(let i = 0 ; i < schedules.length ; i++){
    //                       MODEL.userModel.findOne({
    //                         phone : schedules[i].phone
    //                       }).then((user)=>{
    //                         allUser.push(user);
    //                       })
    //             }
    //         }
    //     })();
    //   });
    //   return res.status.json(allUser)
    // })
    // console.log("all user here", allUser)

  } catch(err){
      return res.status(500).json(err)
  }


  // try {
  //   if (lcd.length == 1) {
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .find({ phone: schedule[i].phone })
  //               .then((user) => {
  //                 console.log(user);
  //               });
  //           }
  //         });

  //     MODEL.userModel.find({ lcd: lcd }).then((checks, err) => {
  //       // const individuals = numberOfOccurence;
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .findOne({ phone: schedule[i].phone })
  //               .then((user) => {});
  //           }
  //         });
  //     });
  //     MODEL.userModel
  //       .aggregate([
  //         { $match: { lcd: lcd, schedulePoints: { $ne: 0 } } },
  //         { $sample: { size: Number(winner_count) } },
  //       ])
  //       .then((winners, err) => {
  //         if (err) return res.status(400).json(err);
  //         for (let i = 0; i < winners.length; i++) {
  //           MODEL.userModel.updateOne(
  //             { _id: winners[i]._id },
  //             { $set: { rafflePoints: winners[i].rafflePoints + 10000 } },
  //             (res) => {
  //               console.log('Winner object update');
  //             }
  //           );
  //         }
  //         return res.status(200).json({ winners: winners });
  //       });

  //     MODEL.userModel.find({ lcd: lcd }).then((checks, err) => {
  //       // const individuals = numberOfOccurence;
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .find({ phone: schedule[i].phone })
  //               .then((user) => {});
  //           }
  //         });
  //     });
  //   } else {
  //     MODEL.userModel.find({ lcd: lcd }).then((checks, err) => {
  //       // const individuals = numberOfOccurence;
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .find({ phone: schedule[i].phone })
  //               .then((user) => {});
  //           }
  //         });
  //     });

  //     MODEL.userModel.find({ lcd: lcd }).then((checks, err) => {
  //       // const individuals = numberOfOccurence;
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .find({ phone: schedule[i].phone })
  //               .then((user) => {});
  //           }
  //         });
  //     });
  //     MODEL.userModel
  //       .aggregate([
  //         { $match: { lcd: lcd, schedulePoints: { $ne: 0 } } },
  //         { $sample: { size: Number(winner_count) } },
  //       ])
  //       .then((winners, err) => {
  //         if (err) return res.status(400).json(err);
  //         for (let i = 0; i < winners.length; i++) {
  //           MODEL.userModel.updateOne(
  //             { _id: winners[i]._id },
  //             { $set: { rafflePoints: winners[i].rafflePoints + 10000 } },
  //             (res) => {
  //               console.log('Winner object update');
  //             }
  //           );
  //         }
  //         return res.status(200).json({ winners: winners });
  //       });

  //     MODEL.userModel.find({ lcd: lcd }).then((checks, err) => {
  //       // const individuals = numberOfOccurence;
  //       MODEL.scheduleModel
  //         .find({ completionStatus: 'completed' })
  //         .then((schedule) => {
  //           for (let i = 0; i < schedule.length; i++) {
  //             MODEL.userModel
  //               .find({ phone: schedule[i].phone })
  //               .then((user) => {});
  //           }
  //         });
  //     });
  //   }
  // } catch (err) {
  //   return res.status(500).json(err);
  // }
};

organisationController.wasteHistory = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: 'completed',
    })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result);
    });
};

organisationController.logHistory = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.paymentLogModel
    .find({ companyId: organisationID })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result);
    });
};

organisationController.lawmaTransaction = (REQUEST, RESPONSE) => {
  const lawmaID = REQUEST.query.lawmaID;

  MODEL.userModel.findOne({ _id: lawmaID, roles: 'admin' }).then((admin) => {
    if (!admin)
      return RESPONSE.status(400).json({ message: 'Not a valid lawma admin' });
    MODEL.transactionModel.find({}).then((result, err) => {
      if (err) return RESPONSE.status(400).status(err);
      return RESPONSE.status(200).json(result);
    });
  });
};

organisationController.adminTransaction = (req, res) => {
  var PROJECTION = {
    recycler: 0,
    organisationID: 0,
    completedBy: 0,
    scheduleId: 0,
  };

  MODEL.transactionModel
    .find({}, PROJECTION)
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data: result,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.adminCompanyTransaction = (req, res) => {
  var PROJECTION = {
    fullname: 0,
    organisationID: 0,
    completedBy: 0,
    scheduleId: 0,
  };

  MODEL.transactionModel
    .find({}, PROJECTION)
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data: result,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.lawmaMonthChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);

  MODEL.scheduleModel
    .find({
      completionStatus: 'completed',
      pickUpDate: {
        $gte: lastWeek,
        $lt: today,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.lawmaThirdChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);
  MODEL.scheduleModel
    .find({
      completionStatus: 'completed',
      pickUpDate: {
        $gte: forthWeek,
        $lt: lastWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'cans')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.lawmaForthChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);

  MODEL.scheduleModel
    .find({
      completionStatus: 'completed',
      pickUpDate: {
        $gte: thirdWeek,
        $lt: forthWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.lawmaWeekChartData = (req, res) => {
  const today = new Date();
  const lastWeek = new Date();
  const forthWeek = new Date();
  const thirdWeek = new Date();
  const lastMonth = new Date();

  lastWeek.setDate(today.getDate() - 7);
  forthWeek.setDate(today.getDate() - 14);
  thirdWeek.setDate(today.getDate() - 21);
  lastMonth.setDate(today.getDate() - 28);

  MODEL.scheduleModel
    .find({
      completionStatus: 'completed',
      pickUpDate: {
        $gte: lastMonth,
        $lt: thirdWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      console.log('result here', result);

      var can = result
        .filter((x) => x.Category == 'Can' || x.Category == 'can')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == 'petBottle' || x.Category == 'petBottle')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == 'carton' || x.Category == 'Carton')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == 'Rubber' || x.Category == 'rubber')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == 'plastic' || x.Category == 'plastic')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var glass = result
        .filter((x) => x.Category == 'glass' || x.Category == 'Glass')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var metal = result
        .filter((x) => x.Category == 'metal' || x.Category == 'Metal')
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      var nylon = result
        .filter(
          (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
        )
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.organisationPayout = (req, res) => {
  const organisationID = req.body.organisationID;

  MODEL.organisationModel.findOne({ _id: organisationID }).then((result) => {
    if (!result)
      return res.status(400).json({
        message: 'This is not a valid organisation',
      });
  });

  try {
    MODEL.transactionModel
      .find({ organisationID: organisationID })
      .then((result, err) => {
        if (err) return res.status(400).json(err);

        console.log('Debts here===>', result);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.recyclerPay = (req, res) => {
  const recyclerID = req.query.recyclerID;

  MODEL.transactionModel
    .find({ completedBy: recyclerID })
    .then((transaction, err) => {
      MODEL.collectorModel.findOne({ _id: recyclerID }).then((result) => {
        if (!result)
          return res.status(400).json({
            message: 'Your collector ID is invalid',
          });

        const totalCoin = transaction
          .map((x) => x.coin)
          .reduce((acc, curr) => acc + curr, 0);
        const data = {
          name: transaction[0].fullname,
          totalCoin: totalCoin,
          transactions: transaction,
        };

        return res.status(200).json(data);
      });
    });
};

organisationController.recyclerActions = (req, res) => {
  const IDs = [];

  MODEL.transactionModel.find({}).then((transaction, err) => {
    const len = transaction.length;

    for (let i = 0; i < transaction.length; i++) {
      if (IDs.includes(transaction[i].completedBy)) {
        console.log('already present');
      } else {
        IDs.push(transaction[i].completedBy);
      }
      console.log('Opooor from here', IDs);

      return IDs;
      console.log('transaction here====>>', transaction[i].completedBy, IDs);

      // MODEL.collectorModel
      //   .findOne({ _id: transaction[i].completedBy })
      //   .then((result) => {
      //     if (!result.organisation)
      //       return res.status(400).json({
      //         message: "Your collector ID is invalid",
      //       });

      //     // const totalCoin = transaction[i]
      //     //   .map((x) => x.coin)
      //     //   .reduce((acc, curr) => acc + curr, 0);
      //     const data = {
      //       name: transaction[i].fullname,
      //       // totalCoin: totalCoin,
      //       transactions: transaction[i],
      //     };
      //   });
    }
    // return res.status(200).json(data)
  });
};

organisationController.allMissedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'missed' })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

organisationController.viewAllSchedules = (REQUEST, RESPONSE) => {
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

organisationController.allPendingSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'pending' })
    .sort({ _id: -1 })
    .then((schedules) => {
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

organisationController.allCompletedSchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'completed' })
    .sort({ _id: -1 })
    .then((schedules) => {
      console.log('Completed schedules here', schedules);
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};

organisationController.allCancelledchedules = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'cancelled' })
    .sort({ _id: -1 })
    .then((schedules) => {
      console.log('Completed schedules here', schedules);
      RESPONSE.status(200).jsonp(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(200).jsonp(COMMON_FUN.sendError(err)));
};

organisationController.totalCoinAnalytics = (req, res) => {
  try {
    MODEL.transactionModel.find({}).then((transaction) => {
      MODEL.payModel.find({}).then((payment) => {
        var notRedeemed = transaction.length - payment.length;

        return res.status(200).json({
          totalTransactions: transaction.length,
          totalRedeemed: payment.length,
          totalNonRedeemed: notRedeemed,
        });
      });
    });
  } catch (err) {}
};

organisationController.deleteCompany = (req, res) => {
  const companyID = req.body.companyID;
  try {
    MODEL.organisationModel
      .deleteOne({
        _id: companyID,
      })
      .then((result) => {
        return res.status(200).json({
          message: 'Recycling company deleted successfully',
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.companyGrowth = (req, res) => {
  // var Jan
  // var Feb
  // var Mar

  var year = new Date().getFullYear();
  console.log('<<<Year>>>', year);

  try {
    MODEL.organisationModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createAt' }, year] },
            { $eq: [{ $month: '$createAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.organisationModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createAt' }, year] },
                { $eq: [{ $month: '$createAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.organisationModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createAt' }, year] },
                    { $eq: [{ $month: '$createAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.organisationModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createAt' }, year] },
                        { $eq: [{ $month: '$createAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.organisationModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createAt' }, year] },
                            { $eq: [{ $month: '$createAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.organisationModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createAt' }, year] },
                                { $eq: [{ $month: '$createAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.organisationModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createAt' }, year] },
                                    { $eq: [{ $month: '$createAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.organisationModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: '$createAt' }, year] },
                                        { $eq: [{ $month: '$createAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.organisationModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: '$createAt' }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.organisationModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.organisationModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: '$createAt' },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.organisationModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.organisationModel
                                                      .find({
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    '$createAt',
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    '$createAt',
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

organisationController.salesGrowth = (req, res) => {
  // var Jan
  // var Feb
  // var Mar

  var year = new Date().getFullYear();
  console.log('<<<Year>>>', year);

  try {
    MODEL.transactionModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.transactionModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.transactionModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.transactionModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.transactionModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.transactionModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.transactionModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.transactionModel
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
                                    MODEL.transactionModel
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
                                        MODEL.transactionModel
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
                                            MODEL.transactionModel
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
                                                MODEL.transactionModel
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
                                                    MODEL.transactionModel
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

organisationController.scheduleAnalysis = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'completed' })
    .sort({ _id: -1 })
    .then((completed) => {
      MODEL.scheduleModel
        .find({ completionStatus: 'missed' })
        .then((missed) => {
          MODEL.scheduleModel
            .find({ completionStatus: 'pending' })
            .then((pending) => {
              MODEL.scheduleModel
                .find({ completionStatus: 'cancelled' })
                .then((cancelled) => {
                  MODEL.scheduleModel
                    .find({
                      collectorStatus: 'accept',
                    })
                    .then((accepted) => {
                      MODEL.scheduleModel.find({}).then((allSchedules) => {
                        return RESPONSE.status(200).jsonp(
                          COMMON_FUN.sendSuccess(
                            CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
                            {
                              allSchedules: allSchedules.length,
                              completed: completed.length,
                              missed: missed.length,
                              pending: pending.length,
                              cancelled: cancelled.length,
                              accepted: accepted.length,
                            }
                          )
                        );
                      });
                    });
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

organisationController.advertGrowth = (req, res) => {
  var year = new Date().getFullYear();
  console.log('<<<Year>>>', year);

  try {
    MODEL.advertModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.advertModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.advertModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.advertModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.advertModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.advertModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.advertModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.advertModel
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
                                    MODEL.advertModel
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
                                        MODEL.advertModel
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
                                            MODEL.advertModel
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
                                                MODEL.advertModel
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
                                                    MODEL.advertModel
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

organisationController.getTotalCompany = (req, res) => {
  try {
    MODEL.organisationModel.find({}).then((organisation) => {
      return res.status(200).json({
        data: organisation.length,
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.totalWeightAnalytics = (req, res) => {
  try {
    MODEL.transactionModel.find({}).then((schedules) => {
      var weights = schedules
        .map((schedule) => schedule.weight)
        .reduce((acc, curr) => acc + curr, 0);
      return res.status(200).json({
        Weight: weights,
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.categoryAnalytics = (REQUEST, RESPONSE) => {
  MODEL.scheduleModel
    .find({ completionStatus: 'completed' })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result.filter((x) => x.Category == 'can');

      var petBottle = result.filter((x) => x.Category == 'petBottle');

      var carton = result.filter((x) => x.Category == 'carton');

      var rubber = result.filter((x) => x.Category == 'rubber');

      var plastics = result.filter((x) => x.Category == 'plastics');

      var glass = result.filter(
        (x) => x.Category == 'glass' || x.Category == 'Glass'
      );

      var metal = result.filter(
        (x) => x.Category == 'metal' || x.Category == 'Metal'
      );

      var nylon = result.filter(
        (x) => x.Category == 'nylonSachet' || x.Category == 'nylonSachet'
      );

      var wood = result.filter(
        (x) => x.Category == 'wood' || x.Category == 'wood'
      );

      return RESPONSE.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
        glass: glass,
        metal: metal,
        nylon: nylon,
        wood: wood,
      });
    })
    .catch((err) => RESPONSE.status(500).json(err));
};

organisationController.licencePaymentGrowth = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();

  try {
    MODEL.companyReceiptModel
      .find({
        paymentType: 'licence',
        $expr: {
          $and: [
            { $eq: [{ $year: '$createdAt' }, year] },
            { $eq: [{ $month: '$createdAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.companyReceiptModel
          .find({
            paymentType: 'licence',
            $expr: {
              $and: [
                { $eq: [{ $year: '$createdAt' }, year] },
                { $eq: [{ $month: '$createdAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.companyReceiptModel
              .find({
                paymentType: 'licence',
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createdAt' }, year] },
                    { $eq: [{ $month: '$createdAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.companyReceiptModel
                  .find({
                    paymentType: 'licence',
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createdAt' }, year] },
                        { $eq: [{ $month: '$createdAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.companyReceiptModel
                      .find({
                        paymentType: 'licence',
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createdAt' }, year] },
                            { $eq: [{ $month: '$createdAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.companyReceiptModel
                          .find({
                            paymentType: 'licence',
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createdAt' }, year] },
                                { $eq: [{ $month: '$createdAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.companyReceiptModel
                              .find({
                                paymentType: 'licence',
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createdAt' }, year] },
                                    { $eq: [{ $month: '$createdAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.companyReceiptModel
                                  .find({
                                    paymentType: 'licence',
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
                                    MODEL.companyReceiptModel
                                      .find({
                                        paymentType: 'licence',
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
                                        MODEL.companyReceiptModel
                                          .find({
                                            paymentType: 'licence',
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
                                            MODEL.companyReceiptModel
                                              .find({
                                                paymentType: 'licence',
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
                                                MODEL.companyReceiptModel
                                                  .find({
                                                    paymentType: 'licence',
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
                                                    MODEL.companyReceiptModel
                                                      .find({
                                                        paymentType: 'licence',
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
                                                        RESPONSE.status(
                                                          200
                                                        ).json({
                                                          JANUARY: jan,
                                                          FEBRUARY: feb,
                                                          MARCH: march,
                                                          APRIL: april,
                                                          MAY: may,
                                                          JUNE: june,
                                                          JULY: july,
                                                          AUGUST: Aug,
                                                          SEPTEMBER: sept,
                                                          OCTOBER: Oct,
                                                          NOVEMBER: Nov,
                                                          DECEMBER: Dec,
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

organisationController.companyReceiptTransactions = (req, res) => {
  try {
    MODEL.companyReceiptModel.find({}).then((receipts) => {
      var business = receipts.filter((x) => x.paymentType !== 'licence');
      return res.status(200).json(business);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.companyGrowthAnalytics = (req, res) => {
  var year = new Date().getFullYear();

  try {
    MODEL.organisationModel
      .find({
        $expr: {
          $and: [
            { $eq: [{ $year: '$createAt' }, year] },
            { $eq: [{ $month: '$createAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.organisationModel
          .find({
            $expr: {
              $and: [
                { $eq: [{ $year: '$createAt' }, year] },
                { $eq: [{ $month: '$createAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.organisationModel
              .find({
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createAt' }, year] },
                    { $eq: [{ $month: '$createAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.organisationModel
                  .find({
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createAt' }, year] },
                        { $eq: [{ $month: '$createAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.organisationModel
                      .find({
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createAt' }, year] },
                            { $eq: [{ $month: '$createAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.organisationModel
                          .find({
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createAt' }, year] },
                                { $eq: [{ $month: '$createAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.organisationModel
                              .find({
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createAt' }, year] },
                                    { $eq: [{ $month: '$createAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.organisationModel
                                  .find({
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: '$createAt' }, year] },
                                        { $eq: [{ $month: '$createAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.organisationModel
                                      .find({
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: '$createAt' }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.organisationModel
                                          .find({
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.organisationModel
                                              .find({
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: '$createAt' },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.organisationModel
                                                  .find({
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.organisationModel
                                                      .find({
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    '$createAt',
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    '$createAt',
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
                                                            companies: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            companies: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            companies: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            companies: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            companies: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            companies: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            companies: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            companies: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            companies: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            companies: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            companies: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            companies: Dec,
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

organisationController.companyDeclineAnalytics = (REQUEST, RESPONSE) => {
  var year = new Date().getFullYear();

  try {
    MODEL.organisationModel
      .find({
        licence_active: false,
        $expr: {
          $and: [
            { $eq: [{ $year: '$createAt' }, year] },
            { $eq: [{ $month: '$createAt' }, 1] },
          ],
        },
      })
      .then((jan) => {
        MODEL.organisationModel
          .find({
            licence_active: false,
            $expr: {
              $and: [
                { $eq: [{ $year: '$createAt' }, year] },
                { $eq: [{ $month: '$createAt' }, 2] },
              ],
            },
          })
          .then((feb) => {
            MODEL.organisationModel
              .find({
                licence_active: false,
                $expr: {
                  $and: [
                    { $eq: [{ $year: '$createAt' }, year] },
                    { $eq: [{ $month: '$createAt' }, 3] },
                  ],
                },
              })
              .then((march) => {
                MODEL.organisationModel
                  .find({
                    licence_active: false,
                    $expr: {
                      $and: [
                        { $eq: [{ $year: '$createAt' }, year] },
                        { $eq: [{ $month: '$createAt' }, 4] },
                      ],
                    },
                  })
                  .then((april) => {
                    MODEL.organisationModel
                      .find({
                        licence_active: false,
                        $expr: {
                          $and: [
                            { $eq: [{ $year: '$createAt' }, year] },
                            { $eq: [{ $month: '$createAt' }, 5] },
                          ],
                        },
                      })
                      .then((may) => {
                        MODEL.organisationModel
                          .find({
                            licence_active: false,
                            $expr: {
                              $and: [
                                { $eq: [{ $year: '$createAt' }, year] },
                                { $eq: [{ $month: '$createAt' }, 6] },
                              ],
                            },
                          })
                          .then((june) => {
                            MODEL.organisationModel
                              .find({
                                licence_active: false,
                                $expr: {
                                  $and: [
                                    { $eq: [{ $year: '$createAt' }, year] },
                                    { $eq: [{ $month: '$createAt' }, 7] },
                                  ],
                                },
                              })
                              .then((july) => {
                                MODEL.organisationModel
                                  .find({
                                    licence_active: false,
                                    $expr: {
                                      $and: [
                                        { $eq: [{ $year: '$createAt' }, year] },
                                        { $eq: [{ $month: '$createAt' }, 8] },
                                      ],
                                    },
                                  })
                                  .then((Aug) => {
                                    MODEL.organisationModel
                                      .find({
                                        licence_active: false,
                                        $expr: {
                                          $and: [
                                            {
                                              $eq: [
                                                { $year: '$createAt' },
                                                year,
                                              ],
                                            },
                                            {
                                              $eq: [{ $month: '$createAt' }, 9],
                                            },
                                          ],
                                        },
                                      })
                                      .then((sept) => {
                                        MODEL.organisationModel
                                          .find({
                                            licence_active: false,
                                            $expr: {
                                              $and: [
                                                {
                                                  $eq: [
                                                    { $year: '$createAt' },
                                                    year,
                                                  ],
                                                },
                                                {
                                                  $eq: [
                                                    { $month: '$createAt' },
                                                    10,
                                                  ],
                                                },
                                              ],
                                            },
                                          })
                                          .then((Oct) => {
                                            MODEL.organisationModel
                                              .find({
                                                licence_active: false,
                                                $expr: {
                                                  $and: [
                                                    {
                                                      $eq: [
                                                        { $year: '$createAt' },
                                                        year,
                                                      ],
                                                    },
                                                    {
                                                      $eq: [
                                                        { $month: '$createAt' },
                                                        11,
                                                      ],
                                                    },
                                                  ],
                                                },
                                              })
                                              .then((Nov) => {
                                                MODEL.organisationModel
                                                  .find({
                                                    licence_active: false,
                                                    $expr: {
                                                      $and: [
                                                        {
                                                          $eq: [
                                                            {
                                                              $year:
                                                                '$createAt',
                                                            },
                                                            year,
                                                          ],
                                                        },
                                                        {
                                                          $eq: [
                                                            {
                                                              $month:
                                                                '$createAt',
                                                            },
                                                            12,
                                                          ],
                                                        },
                                                      ],
                                                    },
                                                  })
                                                  .then((Dec) => {
                                                    MODEL.organisationModel
                                                      .find({
                                                        licence_active: false,
                                                        $expr: {
                                                          $and: [
                                                            {
                                                              $eq: [
                                                                {
                                                                  $year:
                                                                    '$createAt',
                                                                },
                                                                year,
                                                              ],
                                                            },
                                                            {
                                                              $eq: [
                                                                {
                                                                  $month:
                                                                    '$createAt',
                                                                },
                                                                11,
                                                              ],
                                                            },
                                                          ],
                                                        },
                                                      })
                                                      .then((Analytics) => {
                                                        RESPONSE.status(
                                                          200
                                                        ).json({
                                                          JANUARY: {
                                                            amount: jan.length,
                                                            companies: jan,
                                                          },
                                                          FEBRUARY: {
                                                            amount: feb.length,
                                                            companies: feb,
                                                          },
                                                          MARCH: {
                                                            amount:
                                                              march.length,
                                                            companies: march,
                                                          },
                                                          APRIL: {
                                                            amount:
                                                              april.length,
                                                            companies: april,
                                                          },
                                                          MAY: {
                                                            amount: may.length,
                                                            companies: may,
                                                          },
                                                          JUNE: {
                                                            amount: june.length,
                                                            companies: june,
                                                          },
                                                          JULY: {
                                                            amount: july.length,
                                                            companies: july,
                                                          },
                                                          AUGUST: {
                                                            amount: Aug.length,
                                                            companies: Aug,
                                                          },
                                                          SEPTEMBER: {
                                                            amount: sept.length,
                                                            companies: sept,
                                                          },
                                                          OCTOBER: {
                                                            amount: Oct.length,
                                                            companies: Oct,
                                                          },
                                                          NOVEMBER: {
                                                            amount: Nov.length,
                                                            companies: Nov,
                                                          },
                                                          DECEMBER: {
                                                            amount: Dec.length,
                                                            companies: Dec,
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

organisationController.advertControl = (req, res) => {
  const advert = {
    title: req.body.title,
    advert_url: req.body.advert_url,
    duration: req.body.duration,
    start_date: req.body.start_date,
    thumbnail_url: req.body.thumbnail_url,
    authenticated: false,
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    typeOfAdvert: req.body.typeOfAdvert,
    price: req.body.price,
  };
  try {
    MODEL.advertModel(advert).save({}, (ERR, RESULT) => {
      return res.status(200).json({
        message: 'Advert Posted Successfully',
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.deleteAdvert = (REQUEST, RESPONSE) => {
  const advertID = REQUEST.body.advertID;
  try {
    MODEL.advertModel
      .findOne({
        _id: advertID,
      })
      .then((adverts) => {
        console.log('<<>>>', adverts);
        if (!adverts) {
          return RESPONSE.status(200).json({
            message: "This advert doesn't exist",
          });
        } else {
          MODEL.advertModel
            .deleteOne({
              _id: advertID,
            })
            .then((result) => {
              return RESPONSE.status(200).json({
                message: 'Advert deleted successfully',
              });
            });
        }
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

organisationController.monifyHook = (REQUEST, RESPONSE) => {
  const data = { ...REQUEST.body };
  try {
    MODEL.payOutModel(data).save({}, (ERR, RESULT) => {
      return RESPONSE.status(200).json({
        message: 'Payment initiated successfully',
      });
    });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

organisationController.monifyReceipts = (REQUEST, RESPONSE) => {
  const email = REQUEST.query.email;
  try {
    MODEL.payOutModel
      .find({ 'customer.email': email })
      .sort({ _id: -1 })
      .then((receipts) => {
        return RESPONSE.status(200).json(receipts);
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

organisationController.payPortal = (REQUEST, RESPONSE) => {
  const organisation_id = REQUEST.body.organisation_id;
  try {
    MODEL.organisationModel
      .find({
        _id: organisation_id,
      })
      .then((organisation) => {
        MODEL.organisationModel.updateOne(
          { _id: organisation._id },
          { wallet: 0 },
          (err, resp) => {
            if (err) {
              return RESPONSE.status(400).jsonp(err);
            }
            MODEL.transactionModel
              .find({ organisationID: organisation_id })
              .sort({ _id: -1 })
              .then((recycler) => {
                for (let i = 0; i < recycler.length; i++) {
                  MODEL.transactionModel.updateOne(
                    { _id: `${recycler[i]._id}` },
                    { $set: { paid: true } },
                    (err, resp) => {
                      if (err) {
                        return RESPONSE.status(400).jsonp(err);
                      }
                    }
                  );
                }
              });
            return RESPONSE.status(200).json({ message: 'Payout success!' });
          }
        );
      });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

organisationController.organisationRecyclers = (req, res) => {
  const organisation_id = req.query.organisation_id;
  if (!organisation_id) {
    return res.status(400).json({
      message: 'Enter a valid organisation id',
    });
  }
  try {
    MODEL.collectorModel
      .find({
        approvedBy: organisation_id,
      })
      .then((recyclers) => {
        return res.status(200).json({
          data: recyclers,
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.checkProfile = (req, res) => {
  const organisation_id = req.query.organisation_id;

  console.log(organisation_id, '<<-', req.query);
  try {
    MODEL.organisationModel
      .findOne({
        _id: organisation_id,
      })
      .then((profile) => {
        return res.status(200).json(profile);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.updateOrganisationProfile = (req, res) => {
  const organisation_id = req.body.organisation_id;
  try {
    MODEL.organisationModel
      .findOne({
        _id: organisation_id,
      })
      .then((organisation) => {
        if (!organisation)
          return res.status(400).json({
            message: 'Organisation does not exist, check your id and retry!',
          });
        MODEL.organisationModel.updateOne(
          {
            _id: organisation_id,
          },
          {
            email: req.body.email || organisation.email,
            areaOfAccess: req.body.areaOfAccess || organisation.areaOfAccess,
            canEquivalent: req.body.canEquivalent || organisation.canEquivalent,
            cartonEquivalent:
              req.body.cartonEquivalent || organisation.cartonEquivalent,
            petBottleEquivalent:
              req.body.petBottleEquivalent || organisation.petBottleEquivalent,
            rubberEquivalent:
              req.body.rubberEquivalent || organisation.rubberEquivalent,
            plasticEquivalent:
              req.body.plasticEquivalent || organisation.plasticEquivalent,
            woodEquivalent:
              req.body.woodEquivalent || organisation.woodEquivalent,
            glassEquivalent:
              req.body.glassEquivalent || organisation.glassEquivalent,
            nylonEquivalent:
              req.body.nylonEquivalent || organisation.nylonEquivalent,
            metalEquivalent:
              req.body.metalEquivalent || organisation.metalEquivalent,
            streetOfAccess:
              req.body.streetOfAccess || organisation.streetOfAccess,
          },
          (err, resp) => {
            MODEL.geofenceModel
              .deleteMany({
                organisationId: organisation_id,
              })
              .then((err, geo) => {
                console.log(geo);
              });
            var areas = req.body.areaOfAccess;
            for (let j = 0; j < areas.length; j++) {
              request.get(
                {
                  url: `https://maps.googleapis.com/maps/api/geocode/json?address=${areas[j]}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`,
                },
                function (error, response, body) {
                  var result = JSON.parse(body);
                  var LatLong =
                    result.results.map((area) => ({
                      formatted_address: area.formatted_address,
                      geometry: area.geometry,
                    })) || '';
                  MODEL.geofenceModel({
                    organisationId: organisation_id,
                    data: LatLong,
                  }).save({}, (err, result) => {
                    console.log('geofenced');
                  });
                }
              );
            }
            MODEL.collectorModel
              .find({
                approvedBy: organisation._id,
              })
              .then((collector) => {
                for (let i = 0; i < collector.length; i++) {
                  MODEL.collectorModel.updateOne(
                    {
                      _id: collector[i]._id,
                    },
                    {
                      $set: {
                        areaOfAccess: req.body.streetOfAccess,
                      },
                    },
                    (err, resp) => {
                      console.log('update ?', resp);
                    }
                  );
                }

                return res.status(200).json({
                  message: 'Organisation profile updated successfully!',
                });
              });
          }
        );
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.getGeofencedCoordinates = (req, res) => {
  const organisation_id = req.query.organisation_id;
  try {
    MODEL.geofenceModel
      .find({
        organisationId: organisation_id,
      })
      .then((geofence) => {
        return res.status(200).json(geofence);
        // const areas = organisation.areaOfAccess;

        // for (let j = 0; j < areas.length; j++) {
        //   request.get(
        //     {
        //       url: `https://maps.googleapis.com/maps/api/geocode/json?address=${areas[j]}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`,
        //     },
        //     function (error, response, body) {
        //       var result = JSON.parse(body);
        //       var LatLong = result.results.map((area) => ({
        //         formatted_address: area.formatted_address,
        //         geometry: area.geometry,
        //       }));
        //       MODEL.geofenceModel({
        //         organisationId: organisation_id,
        //         data: LatLong,
        //       }).save({}, (err, result) => {
        //         console.log(result);
        //       });
        //       arrLat.push(LatLong);
        //       console.log(arrLat);
        //     }
        //   );
        // }
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.resetCompanyPassword = (req, res) => {
  const resetToken = COMMON_FUN.generateRandomString();
  const email = req.body.email;

  try {
    MODEL.organisationModel
      .findOne({
        email: email,
      })
      .then((organisation) => {
        if (!organisation) {
          return res.status(400).json({
            message: 'Organisation does not exist',
          });
        }

        sgMail.setApiKey(
          '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'
        );
        const msg = {
          to: `${email}`,
          from: 'pakam@xrubiconsolutions.com', // Use the email address or domain you verified above
          subject: 'FORGOT PASSWORD',
          text: `
              Kindly log on to https://dashboard.pakam.ng/otp to input your reset token.
              
            
              Reset Token: ${resetToken}
            
           
              Best Regard
        
              Pakam Team
        `,
        };
        //ES6
        sgMail.send(msg).then(
          () => {},
          (error) => {
            console.error(error);

            if (error.response) {
              console.error(error.response.body);
            }
          }
        );
        MODEL.organisationModel.updateOne(
          {
            email: email,
          },
          {
            $set: {
              resetToken: resetToken,
            },
          },
          (err, response) => {
            return res.status(200).json({
              message: 'Reset token sent successfully',
            });
          }
        );
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.validateCompanyToken = (req, res) => {
  const email = req.body.email;
  const resetToken = req.body.resetToken;

  try {
    MODEL.organisationModel
      .findOne({
        email: email,
      })
      .then((organisation) => {
        if (resetToken === organisation.resetToken) {
          return res.status(200).json({
            message: 'Token input successful',
          });
        }
        return res.status(400).json({
          message: 'Token input failed',
        });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.changeCompanyPassword = (req, res) => {
  const email = req.body.email;
  try {
    MODEL.organisationModel.findOne({ email: email }).then((result) => {
      if (!result) {
        return RESPONSE.status(400).json({
          message: 'This account does not exist',
        });
      }

      COMMON_FUN.encryptPswrd(req.body.password, (ERR, HASH) => {
        /********** update password in organisationModel ********/
        MODEL.organisationModel
          .updateOne({ email: email }, { $set: { password: HASH } })
          .then((SUCCESS) => {
            return res
              .status(200)
              .json(
                COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.UPDATED)
              );
          })
          .catch((ERR) => {
            return res.status(400).json(COMMON_FUN.sendError(ERR));
          });
      });
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};


organisationController.organisationSchedulesPending = (REQUEST,RESPONSE)=>{
  const organisationID = REQUEST.query.organisationID;
  var need = [];
  var count = 0;
  var geofencedSchedules = [];
  const active_today = new Date();
  active_today.setHours(0);
  active_today.setMinutes(0);
  var tomorrow = new Date();
  tomorrow.setDate(new Date().getDate()+7);

  MODEL.organisationModel.findOne({ _id: organisationID }).then((collector) => {
    var accessArea = collector.streetOfAccess;

    MODEL.scheduleModel
      .find({
        $and: [
          {
          pickUpDate : {
            $gte: active_today
          },
          pickUpDate : {
            $lt: tomorrow
          },    
        }       
        ],
      })
      .sort({ _id: -1 })
      .then((schedules) => {
        schedules.forEach((schedule, index) => {
          var test = schedule.address.split(', ');
          (function route() {
            for (let i = 0; i < accessArea.length; i++) {
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
        var geoSchedules = geofencedSchedules.filter(x => (x.completionStatus !== "completed" && x.completionStatus !== "cancelled" && x.completionStatus !== "missed") || (x.completionStatus == 'pending' && x.collectorStatus == "accept")
        );
        const referenceSchedules = [ ...new Set(geoSchedules)];
        RESPONSE.jsonp(
          COMMON_FUN.sendSuccess(
            CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT,
            referenceSchedules
          )
        );
      })
      .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
  });
}

/* export organisationControllers */
module.exports = organisationController;
