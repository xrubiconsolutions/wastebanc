"use strict";

/**************************************************
 ***** LIVE REPORTING controller for REPORT logic ****
 **************************************************/

let reportController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
let FS = require("fs");
const { Response } = require("aws-sdk");
var request = require("request");
const OpenTok = require("opentok");

const apiKey = "46903784";
const secret = "7c433b3970838bffa4ec979d8337c19a8962fba8";

var opentok = new OpenTok(apiKey, secret);

reportController.report = (req, res) => {
  var userID = req.body.userID;
  var lat = req.body.lat;
  var long = req.body.long;

  var token;
  var roomToSessionIdDictionary = {};

  MODEL.reportModel
    .findOne({
      userReportID: userID,
    })
    .then((result, user) => {
      // console.log("------>",result)
      if (result) {
        return res.status(200).json(result);
      } else {
        opentok.createSession({ mediaMode: "routed" }, function (err, session) {
          if (err) {
            console.log(err);
            res.status(500).send({ error: "createSession error:" + err });
            return;
          }

          // roomToSessionIdDictionary[roomName] = session.sessionId;

          // generate token
          token = opentok.generateToken(session.sessionId);
          MODEL.reportModel({
            apiKey: apiKey,
            sessionID: session.sessionId,
            token: token,
            userReportID: userID,
            lat: lat,
            long: long,
          }).save({}, (err, result) => {
            console.log("error here", err);
            if (err)
              return res
                .status(400)
                .json({ message: "Could not save report incidence" });
            console.log(result);
          });
          res.setHeader("Content-Type", "application/json");
          return res.json({
            apiKey: apiKey,
            sessionId: session.sessionId,
            token: token,
          });
        });
      }
    });
};

reportController.getReport = (req, res) => {
  var ID = req.body.userID;

  MODEL.reportModel
    .findOne({ userReportID: ID })
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => res.status(500).json(err));
};

reportController.allReport = (req, res) => {
  MODEL.reportModel
    .find({})
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => res.status(500).json(err));
};

/* export reportControllers */
module.exports = reportController;
