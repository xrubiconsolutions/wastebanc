"use strict";

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let payController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
var request = require("request");
const payModel = require("../models/payModel");
var ObjectId = require("mongodb").ObjectID;

payController.getBanks = (req, res) => {
  request(
    {
      url: "https://api.paystack.co/bank",
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        Authorization: `Bearer sk_test_a9fa4b3ea294cde982654ac464b9f3e20e90a24c`,
      },
      json: true,
    },
    (err, result) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result.body.data);
    }
  );
};

payController.resolveAccount = (req, res) => {
  const account_number = req.query.account_number;
  const bank_code = req.query.bank_code;

  request(
    {
      url: `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        Authorization: `Bearer sk_test_a9fa4b3ea294cde982654ac464b9f3e20e90a24c`,
      },
      json: true,
    },
    (err, result) => {
      console.log("err=>", err);
      if (err) return res.status(400).json(err);
      return res.status(200).json(result.body.data);
    }
  );
};

payController.saveReceipt = (REQUEST, RESPONSE) => {
  let errors = {};
  const receipt = { ...REQUEST.body };
  // let userId = REQUEST.body.userId;
  // let fullname = REQUEST.body.fullname;
  // let bankAcNo = REQUEST.body.bankAcNo;
  // let bankName = REQUEST.body.bankName;
  let cardID = REQUEST.body.cardID;
  let amount = REQUEST.body.amount;
  var balance;

  MODEL.userModel.findOne({ cardID: cardID }).then((result, err) => {
    if (!result)
      return RESPONSE.status(400).json({ message: "Enter a valid card ID" });
    if (result) {
      balance = result.availablePoints - amount;
      if (balance < 0) {
        return RESPONSE.status(406).json({
          message: "You don't have enough points to complete this transaction",
        });
      }
      MODEL.transactionModel
        .find({
          paid: false,
          requestedForPayment: false,
          cardID: cardID,
        })
        .then((unpaidFees) => {
          for (let i = 0; i < unpaidFees.length; i++) {
            MODEL.userModel.updateOne(
              { cardID: cardID },
              { availablePoints: balance },
              (err, resp) => {
                MODEL.payModel({
                  ...receipt,
                  aggregatorName: unpaidFees[i].recycler || " ",
                  aggregatorId: unpaidFees[i].aggregatorId || " ",
                  aggregatorOrganisation: unpaidFees[i].organisation || " ",
                  scheduleId: unpaidFees[i].scheduleId || " ",
                  quantityOfWaste: unpaidFees[i].weight || " ",
                  amount: unpaidFees[i].coin,
                  organisation: unpaidFees[i].organisationID,
                }).save({}, (err, results) => {
                  MODEL.transactionModel.updateOne(
                    { _id: unpaidFees[i]._id },
                    {
                      $set: {
                        requestedForPayment: true,
                      },
                    },
                    (err, res) => {
                      console.log("updated here", err);
                    }
                  );
                  MODEL.organisationModel
                    .findOne({
                      companyName: unpaidFees[i].organisation,
                    })
                    .then((organisation) => {
                      var phoneNo = String(organisation.phone);
                      var data = {
                        to: `234${phoneNo}`,
                        from: "N-Alert",
                        sms: `Dear ${unpaidFees[i].organisation}, a user named ${receipt.fullname} just requested for a payout of ${unpaidFees[i].coin}, kindly attend to the payment.`,
                        type: "plain",
                        api_key:
                          "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
                        channel: "dnd",
                      };

                      var options = {
                        method: "POST",
                        url: "https://termii.com/api/sms/send",
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
                        console.log(response.body);
                      });

                      if (err)
                        return RESPONSE.status(400).json({
                          message: "Could not save receipt",
                        });
                    });
                });
              }
            );
          }
          return RESPONSE.status(201).json(result);
        });
    }
  });
};

payController.charityPayment = (REQUEST, RESPONSE) => {
  let errors = {};
  const receipt = { ...REQUEST.body };
  let cardID = REQUEST.body.cardID;
  let amount = REQUEST.body.amount;
  var balance;

  MODEL.userModel.findOne({ cardID: cardID }).then((result, err) => {
    if (!result)
      return RESPONSE.status(400).json({ message: "Enter a valid card ID" });
    if (result) {
      balance = result.availablePoints - amount;
      if (balance < 0) {
        return RESPONSE.status(406).json({
          message: "You don't have enough points to complete this transaction",
        });
      }
      MODEL.transactionModel
        .find({
          paid: false,
          requestedForPayment: false,
          cardID: cardID,
        })
        .then((unpaidFees) => {
          for (let i = 0; i < unpaidFees.length; i++) {
            MODEL.userModel.updateOne(
              { cardID: cardID },
              { availablePoints: balance },
              (err, resp) => {
                MODEL.charityModel({
                  ...receipt,
                  aggregatorName: unpaidFees[i].recycler || " ",
                  aggregatorId: unpaidFees[i].aggregatorId || " ",
                  aggregatorOrganisation: unpaidFees[i].organisation || " ",
                  scheduleId: unpaidFees[i].scheduleId || " ",
                  quantityOfWaste: unpaidFees[i].weight || " ",
                  amount: unpaidFees[i].coin,
                  organisation: unpaidFees[i].organisationID,
                }).save({}, (err, result) => {
                  if (err) {
                    return RESPONSE.status(400).json({
                      message: "Could not save receipt",
                    });
                  }
                  console.log("Charity saved here", result);
                  MODEL.transactionModel.updateOne(
                    { _id: unpaidFees[i]._id },
                    {
                      $set: {
                        requestedForPayment: true,
                        paymentResolution: "charity",
                      },
                    },
                    (err, res) => {
                      console.log("updated here", err);
                    }
                  );
                });
              }
            );
          }
          return RESPONSE.status(201).json(result);
        });
    }
  });
};

payController.afterPayment = (req, res) => {
  const userID = req.query.userID;
  try {
    MODEL.userModel.findOne({ _id: userID }).then((result) => {
      var test = JSON.parse(JSON.stringify(result));
      var jwtToken = COMMON_FUN.createToken(test); /** creating jwt token */
      test.token = jwtToken;
      return res
        .status(200)
        .jsonp(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, test)
        );
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

payController.requestedPayment = (req, res) => {
  let company_id = req.query.company_id;
  try {
    payModel
      .find({ organisation: company_id })
      .sort({
        _id: -1,
      })
      .then((payments) => {
        return res.status(200).json(payments);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

payController.allPayoutHistory = (req, res) => {
  try {
    payModel.find({}).then((payments) => {
      return res.status(200).json(payments);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

payController.paymentUpdate = (req, res) => {
  const id = req.body.id;
  try {
    MODEL.payModel.updateOne(
      { scheduleId: ObjectId(id) },
      { $set: { paid: true } },
      (_e, _res) => {
        MODEL.transactionModel.updateOne(
          { scheduleId: ObjectId(id) },
          { $set: { paid: true } },
          (err, resp) => {
            if (err) {
              return res.status(400).jsonp(err);
            }
            return res.status(200).json({
              message: "Payment status successfully updated!",
            });
          }
        );
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};
/* export payController */
module.exports = payController;
