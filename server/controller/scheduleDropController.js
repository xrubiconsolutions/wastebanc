'use strict';

let scheduleDropController = {};
let MODEL = require('../models');
let COMMON_FUN = require('../util/commonFunction');
let CONSTANTS = require('../util/constants');


scheduleDropController.schedule = (REQUEST, RESPONSE) => {
  var data = { ...REQUEST.body };

  MODEL.userModel.findOne({ email: REQUEST.body.client }).then((result) => {
    MODEL.userModel.updateOne(
      { email: REQUEST.body.scheduleCreator },
      { last_logged_in: new Date() },
      (res) => {
        console.log('Logged date updated', new Date());
      }
    );

    
    MODEL.scheduleDropModel(data).save({}, (ERR, RESULT) => {
      try {
        if (ERR) return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));

        return RESPONSE.status(200).json(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, RESULT)
        );
      } catch (err) {
        return RESPONSE.status(400).json(err);
      }
    });
  });
};

scheduleDropController.getPendingSchedule = (REQUEST, RESPONSE) => {
    const creator = REQUEST.query.email
    PROJECTION = { __v: 0, createAt: 0 };

  MODEL.scheduleDropModel
    .find({
        scheduleCreator : email,
        completionStatus : "pending"
    })
    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.getCompletedSchedule = (REQUEST, RESPONSE) => {
    const creator = REQUEST.query.email
    PROJECTION = { __v: 0, createAt: 0 };

  MODEL.scheduleDropModel
    .find({
        scheduleCreator : email,
        completionStatus : "completed"
    })
    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};


module.exports = scheduleDropController;
