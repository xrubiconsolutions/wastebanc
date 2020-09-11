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

organisationController.createOrganisation = (req, res) => {
  const organisation_data = { ...req.body };
  const errors = {};
  MODEL.organisationModel
    .findOne({ companyName: organisation_data.companyName })
    .then((user) => {
      if (user) {
        errors.email = "Company already exists";
        RESPONSE.status(400).jsonp(errors);
      } else {
        MODEL.organisationModel(organisation_data).save({}, (ERR, RESULT) => {
          if (ERR) return res.status(400).json(ERR);
          return res.status(200).json(RESULT);
        });
      }
    })
    .catch((err) => res.status(500).json(err));
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
    .find({ organisationID : organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data : result
      });
    })
    .catch((err) => res.status(500).json(err));
};


organisationController.totalSchedules = (req, res) => {
  const organisationID = req.query.organisationID;

  MODEL.transactionModel
    .find({ organisationID : organisationID })
    .sort({ _id: -1 })
    .then((result, err) => {
      var len = result.length
      if (err) return res.status(400).json(err);
      return res.status(200).json({
        data : len
      });
    })
    .catch((err) => res.status(500).json(err));
};

/* export organisationControllers */
module.exports = organisationController;
