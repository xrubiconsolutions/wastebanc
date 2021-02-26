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

/* export versionController */
module.exports = versionController;
