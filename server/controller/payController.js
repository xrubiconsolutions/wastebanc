'use strict';

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let payController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
let FS = require('fs');
const { Response } = require('aws-sdk');
var request = require('request');
const https = require('https');
const payModel = require('../models/payModel');

payController.getBanks = (req, res) => {
  request(
    {
      url: 'https://api.paystack.co/bank',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
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
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Accept-Charset': 'utf-8',
        Authorization: `Bearer sk_test_a9fa4b3ea294cde982654ac464b9f3e20e90a24c`,
      },
      json: true,
    },
    (err, result) => {
      console.log('err=>', err);
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
      return RESPONSE.status(400).json({ message: 'Enter a valid card ID' });
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
                  amount: unpaidFees[i].coin,
                  organisation: unpaidFees[i].organisationID,
                }).save({}, (err, result) => {
                  if (err)
                    return RESPONSE.status(400).json({
                      message: 'Could not save receipt',
                    });
                  return RESPONSE.status(201).json(result);
                });
              }
            );
          }
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
    payModel.find({organisation : company_id}).then((payments) => {
      return res.status(200).json(payments);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

payController.allPayoutHistory = (req,res)=>{
  try{
      MODEL.paymentLogModel.find({}).then(payments=>{
        return res.status(200).json(payments);
      })
  }
  catch(err){
    return res.status(500).json(err);
  }
}

payController.paymentUpdate = (req,res)=>{
  const id = req.body.id;
  try{
    MODEL.transactionModel.updateOne(
      { "_id": id },
     { "$set": { "paid" : true } },
      (err, resp) => {
        if (err) {
          return RESPONSE.status(400).jsonp(err);
        }
      }
    );
  }catch(err){
    return res.status(500).json(err);
  }
}
/* export payController */
module.exports = payController;
