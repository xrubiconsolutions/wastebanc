"use strict";

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let organisationController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");

let auth = require("../util/auth");

var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pakambusiness@gmail.com",
    pass: "pakambusiness-2000",
  },
});

organisationController.createOrganisation = (req, RESPONSE) => {
  const organisation_data = { ...req.body };
  const errors = {};
  const password =
    organisation_data.companyName + "-" + COMMON_FUN.generateRandomString();
  console.log("Password generate", password);

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
              errors.email = "Company already exists";
              RESPONSE.status(400).jsonp(errors);
            } else {
              MODEL.organisationModel(organisation_data).save(
                {},
                (ERR, RESULT) => {
                  if (ERR) RESPONSE.status(400).jsonp(ERR);
                  else {
                    var mailOptions = {
                      from: "pakambusiness@gmail.com",
                      to: `${organisation_data.email}`,
                      subject: "WELCOME TO PAKAM ORGANISATION ACCOUNT",
                      text: `Organisation account credentials: Log into your account with your email :${organisation_data.email}. Your password for your account is :  ${password}`,
                    };

                    transporter.sendMail(mailOptions, function (error, info) {
                      if (error) {
                        console.log(error);
                      } else {
                        console.log("Email sent: " + info.response);
                      }
                    });
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

organisationController.listOrganisation = (req, res) => {
  let errors = {};

  MODEL.organisationModel
    .find({})
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
      console.log("approved by us");
      return res.jsonp({ message: "You just approved a recycler" });
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
        .reduce((acc, curr) => acc + curr);
      return res.status(200).json({
        totalCoinTransaction: totalCoin,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.wasteCounter = (req, res) => {
  const organisationID = req.query.organisationID;

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


organisationController.allPendingRecycler = (req,res)=>{

    const organisation = req.query.organisation


    if(!organisation) return res.status(400).json({
      message : "Enter your organisation name !"
    })
      try {

          MODEL.collectorModel.find({
            organisation : organisation,
            "approvedBy": { $exists: false, $eq: null }
          }).then((result, err)=>{
            if(err) return res.status(400).json({
              message : "No recycler found"
            })
            return res.status(200).json(result)
          })
      }
      catch(err){
            return res.status(500).json(err)
      }


}



organisationController.payRecyclers = (req, res) => {
  const receipt = { ...req.body };

  try {
    MODEL.companyReceiptModel
      .findOne({ transaction_id: receipt.transaction_id })
      .then((result, err) => {
        if (result)
          return res.status(400).json({
            message: "This transaction had already been saved on the database",
          });

        MODEL.companyReceiptModel(receipt).save({}, (ERR, RESULT) => {
          if (ERR) return res.status(400).json(ERR);

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
        console.log("opoor ye ye", result);
        if (result)
          return res.status(400).json({
            message: "This log had already been saved on the database",
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: lastWeek,
        $lt: today,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: forthWeek,
        $lt: lastWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "Cartoon")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: thirdWeek,
        $lt: forthWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: lastMonth,
        $lt: thirdWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      console.log("result here", result);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
      });
    })
    .catch((err) => res.status(500).json(err));
};

organisationController.raffleTicket = (req, res) => {
  try {
    MODEL.userModel
      .aggregate([{ $sample: { size: 1 } }, { $match: { roles: "client" } }])
      .then((result, err) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json({ winner: result[0] });
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

organisationController.wasteHistory = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.scheduleModel
    .find({
      organisationCollection: organisationID,
      completionStatus: "completed",
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

  MODEL.userModel.findOne({ _id: lawmaID, roles: "admin" }).then((admin) => {
    if (!admin)
      return RESPONSE.status(400).json({ message: "Not a valid lawma admin" });
    MODEL.transactionModel.find({}).then((result, err) => {
      if (err) return RESPONSE.status(400).status(err);
      return RESPONSE.status(200).json(result);
    });
  });
};


organisationController.adminTransaction = (req, res) => {

  var PROJECTION = { recycler :0, organisationID: 0 , completedBy: 0, scheduleId: 0}


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


 var PROJECTION = { fullname:0, organisationID: 0 , completedBy: 0, scheduleId: 0}

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
      completionStatus: "completed",
      pickUpDate: {
        $gte: lastWeek,
        $lt: today,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: forthWeek,
        $lt: lastWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "Cartoon")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: thirdWeek,
        $lt: forthWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
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
      completionStatus: "completed",
      pickUpDate: {
        $gte: lastMonth,
        $lt: thirdWeek,
      },
    })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      console.log("result here", result);

      var can = result
        .filter((x) => x.Category == "Can")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var petBottle = result
        .filter((x) => x.Category == "Pet Bottle")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var carton = result
        .filter((x) => x.Category == "carton")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var rubber = result
        .filter((x) => x.Category == "Rubber")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);
      var plastics = result
        .filter((x) => x.Category == "Plastics")
        .map((x) => x.quantity)
        .reduce((acc, curr) => acc + curr, 0);

      return res.status(200).json({
        can: can,
        petBottle: petBottle,
        carton: carton,
        rubber: rubber,
        plastics: plastics,
      });
    })
    .catch((err) => res.status(500).json(err));
};


/* export organisationControllers */
module.exports = organisationController;
