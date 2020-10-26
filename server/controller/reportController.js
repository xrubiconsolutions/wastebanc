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

const apiKey = "46966734";
const secret = "756c6f3e6d09a3a96ac3ea3252237f0982512583";

var opentok = new OpenTok(apiKey, secret);

reportController.report = (req, res) => {
  var userID = req.body.userID;
  var lat = req.body.lat;
  var long = req.body.long;
  const today = new Date();




  var token;
  var roomToSessionIdDictionary = {};

  MODEL.reportModel.updateOne({ userReportID: userID }, { active : true }).then(test=>
  MODEL.reportModel
    .findOne({
      userReportID: userID,
    })
    .then((result, user) => {

      if(result){

      var Valid = result.createdAt;
     

      var validity =  (today-Valid)/(3600*24*1000);

      if (result && validity < 29) {
        return res.status(200).json(result);
      } 
      
    }else {
        opentok.createSession({ mediaMode: "routed" }, function (err, session) {
          if (err) {
            console.log(err);
            res.status(500).send({ error: "createSession error:" + err });
            return;
          }
          var tokenOptions = {};
          tokenOptions.expireTime = (Date.now() / 1000 ) +  2592000



          // generate token
          token = opentok.generateToken(session.sessionId, tokenOptions);



          MODEL.userModel.findOne({_id: userID}).then(userDetail=>{
          
          MODEL.reportModel.findOne({userReportID:userID}).then(result=>{
            console.log('<<>>', result)
            if(result && validity > 29 ) {

              MODEL.reportModel.updateOne({ userReportID: result.userReportID }, { active : true , name: userDetail.firstname,
                email: userDetail.email,
                phone: userDetail.phone,
                apiKey: apiKey,
                sessionID: session.sessionId,
                token: token,
                userReportID: userID,
                lat: lat,
                long: long,  }).then( test=> { MODEL.reportModel.findOne({userReportID:userID}).then(result=>{  
                  return res.status(200).json(result)
                }) }
                  )
            //   return res.status(400).json({
            //   message: "User exists on our DB"
            // })
          }
          // MODEL.reportModel({
          //   name: userDetail.firstname,
          //   email: userDetail.email,
          //   phone: userDetail.phone,
          //   apiKey: apiKey,
          //   sessionID: session.sessionId,
          //   token: token,
          //   userReportID: userID,
          //   lat: lat,
          //   long: long,
          // }).save({}, (err, result) => {
          //   console.log("error here", err);
          //   if (err)
          //     return res
          //       .status(400)
          //       .json({ message: "Could not save report incidence" });
          //   console.log(result);
          // });

          // res.setHeader("Content-Type", "application/json");
          // return res.json({
          //   apiKey: apiKey,
          //   sessionID: session.sessionId,
          //   token: token,
          // });

          })
         
        })
        });
      }
    })
  );
};

reportController.getReport = (req, res) => {
  var ID = req.body.userID;

  MODEL.reportModel
    .updateOne({ userReportID: ID }, { active : true })
    .then((result) => {
      if(!!result){
        MODEL.reportModel.findOne({
          userReportID: ID
        }).then((user)=>{
          return res.status(200).json(user);
        })
      }
    })
    .catch((err) => res.status(500).json(err));
};



reportController.allReport = (req, res) => {
  MODEL.reportModel
    .find({})
    .sort({ _id: -1 })
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => res.status(500).json(err));
};


reportController.endReport = (req,res)=>{
  var ID = req.body.userID;

  MODEL.reportModel
  .findOne({ userReportID: ID })
  .then((user) => {
    MODEL.reportModel.updateOne({ userReportID: ID }, { $set: { "active" : false } }, (err, resp)=>{
      if(err) return res.status(400).json(err)
      return res.status(200).json({message: "Session successfully ended"})
    })
  })
  .catch((err) => res.status(500).json(err));

}


// reportController.

/* export reportControllers */
module.exports = reportController;
