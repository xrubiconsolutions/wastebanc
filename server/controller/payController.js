"use strict";

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let payController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");
const https = require('https')

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
  const bank_code = req.query.bank_code

  request(
    {
      url: `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Accept-Charset": "utf-8",
        "Authorization": `Bearer sk_test_a9fa4b3ea294cde982654ac464b9f3e20e90a24c`,
      },
      json: true,  
    },
    (err, result) => {
        console.log("err=>", err)
      if (err) return res.status(400).json(err);
      return res.status(200).json(result.body.data);
    }
  );
};

payController.saveReceipt = (req, res) => {
  let errors = {};
  const receipt = { ...req.body }
  // let userId = req.body.userId;
  // let fullname = req.body.fullname;
  // let bankAcNo = req.body.bankAcNo;
  // let bankName = req.body.bankName;
  let cardID = req.body.cardID;
  let amount = req.body.amount;
  var balance;


  MODEL.userModel.findOne({ "cardID" : cardID }).then((result, err)=>{
          if(!result) return res.status(400).json({message: "Enter a valid card ID"})
          if(result){
              balance = result.availablePoints - amount
              if( balance <= 0 ) {
                return res.status(406).json({message: "You don't have enough points to complete this transaction"})
              }
              MODEL.userModel.updateOne({cardID: cardID}, {availablePoints: balance }, (err,resp)=>{
                  MODEL.payModel(receipt).save({},(err, result) => {
                    console.log("error here", err);
                    if (err)
                      return res
                        .status(400)
                        .json({ message: "Could not save receipt" });
                    console.log(result);
                    return res.status(201).json(result)
                  })
              })
          }
  })
};



/* export payController */
module.exports = payController;
