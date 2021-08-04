'use strict';

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let versionController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let SERVICE = require('../services/commonService');
let CONSTANTS = require('../util/constants');
var request = require('request');
const versionModel = require('../models/versionModel');
var ObjectId = require('mongodb').ObjectID;

versionController.createAppVersion = (req, res) => {
  const app_details = {
    ...req.body,
  };

  try {
    MODEL.versionModel(app_details).save({}, (ERR, RESULT) => {
      if (ERR) return res.status(400).json(ERR);
      return res.status(200).json(RESULT);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

versionController.updateVersion = (req, res) => {
  const app_id = req.body.app_id;
  const app_version = req.body.app_version;
  try {
    MODEL.versionModel.updateOne(
      { _id: app_id },
      { latest_version: app_version },
      (err, resp) => {
        if (err) {
          return res.status(400).jsonp(err);
        }
        return res
          .status(200)
          .json({ message: 'App version updated successfully' });
      }
    );
  } catch (err) {
    return res.status(500).json(err);
  }
};

versionController.getAppVersion = (req, res) => {
  const app_type = req.query.app_type;
  try {
    MODEL.versionModel
      .findOne({
        app_type: app_type,
      })
      .then((version_details) => {
        if (!version_details) {
          return res.status(400).json({
            message: 'App version details not found',
          });
        }
        return res.status(200).json(version_details);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

versionController.adminAppVersions = (req, res) => {
  try {
    MODEL.versionModel.find({}).then((apps) => {
      return res.status(200).json(apps);
    });
  } catch (err) {
    return res.status(500).json(err);
  }
};

versionController.sendBulkSms = (req, res) => {
  try {
    MODEL.userModel
      .find({
        roles: 'client',
      })
      .then((data) => {
        var phones = data.map((x) => x.phone);
        for (let i = 0; i < phones.length; i++) {
          var phoneNo = String(phones[i]).substring(1, 11);

          var data = {
            to: `234${phoneNo}`,
            from: 'N-Alert',
            sms: `Dear Pakam Customer,       
              Apologies for delay in pick-up. We are working with partners to resolved
              this as soon as possible. Thank you for your patience.`,
            type: 'plain',
            api_key:
              'TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63',
            channel: 'dnd',
          };

          var options = {
            method: 'POST',
            url: 'https://termii.com/api/sms/send',
            headers: {
              'Content-Type': ['application/json', 'application/json'],
            },
            body: JSON.stringify(data),
          };
          console.log('->', phoneNo);

          request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
          });
        }
      });
  } catch (err) {
    return res, status(500).json(err);
  }
};

versionController.submitLCD = (req,res)=>{
  const data = { ...req.body }
  try{
    MODEL.localGovernmentModel(data).save({}, (err,result)=>{
      if(err) return res.status(400).json(err)
      return res.status(200).json(result);
    })

  }
  catch(err){
          return res.status(500).json(err);
  }
}

versionController.getLCD = (req,res)=>{
  try{
        MODEL.localGovernmentModel.find({}).then(data=>{
          return res.status(200).json(data)
        })
  }
  catch(err){
        return res.status(500).json(err);
  }
}

versionController.updateLCD = (req,res)=>{
  const id = req.body.id;
  try{
      MODEL.localGovernmentModel.updateOne({
        _id: id
      }, {
          lcd  : req.body.lcd,
          lga: req.body.lga
      }, (err, result)=>{
        return res.status(200).json({
          message: "Manage areas updated successfully"
        })
      })
  }
  catch(err){
    return res.status(500).json(err)
  }
}
/* export versionController */
module.exports = versionController;
