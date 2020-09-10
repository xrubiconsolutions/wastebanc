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

payController.getBanks = (req, res) => {
  request(
    {
      url: "https://api.flutterwave.com/v3/banks/NG",
      method: "GET",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        Authorization: `Bearer FLWSECK_TEST-cf7dcc9bff513482affd9dab1b7bf7ce-X`,
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
  const account_number = req.body.account_number;
  const bank_code = req.body.account_bank;

  request(
    {
      url: "https://api.flutterwave.com/v3/accounts/resolve",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Charset": "utf-8",
        Authorization: `Bearer FLWSECK_TEST-cf7dcc9bff513482affd9dab1b7bf7ce-X`,
      },
      json: true,
      body: {
            "account_number": `${account_number}`,
            "account_bank": `${bank_code}`,  
      },
    },
    (err, result) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json(result);
    }
  );
};

payController.listOrganisation = (req, res) => {
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

payController.agentApproval = (req, res) => {
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

payController.agentDecline = (req, res) => {
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

/* export payControllers */
module.exports = payController;
