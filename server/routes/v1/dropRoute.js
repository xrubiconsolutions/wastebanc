"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const { checkRequestErrs } = require("../../util/commonFunction");
const scheduleValidator = require("../../validators/scheduleValidators");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {
  APP.route("/api/v2/submit/drop/request").post(
    scheduleValidator.dropOff,
    checkRequestErrs,
    CONTROLLER.scheduleDropController.schedule
  );

  APP.route("/api/pending/drop/request").get(
    auth.adminPakamValidation,
    CONTROLLER.scheduleDropController.getPendingSchedule
  );

  APP.route("/api/completed/drop/request").get(
    auth.adminPakamValidation,
    CONTROLLER.scheduleDropController.getCompletedSchedule
  );

  APP.route("/api/complete/recycler/payment/drop").post(
    auth.recyclerValidation,
    CONTROLLER.scheduleDropController.rewardDropSystem
  );

  APP.route("/api/pending/user/drop").get(
    auth.userValidation,
    CONTROLLER.scheduleDropController.getPendingScheduleUser
  );

  APP.route("/api/completed/user/drop").get(
    auth.userValidation,
    CONTROLLER.scheduleDropController.getCompletedScheduleUser
  );

  APP.route("/api/get/recycler/drop").get(
    auth.recyclerValidation,
    CONTROLLER.scheduleDropController.dropRequestRecycler
  );

  APP.route("/api/get/drop/pending").get(
    auth.adminPakamValidation,
    CONTROLLER.scheduleDropController.monthlyDropPending
  );

  APP.route("/api/get/drop/completed").get(
    auth.adminPakamValidation,
    CONTROLLER.scheduleDropController.monthlyDropCompleted
  );

  APP.route("/api/get/completed/recycler/drop").get(
    auth.recyclerValidation,
    CONTROLLER.scheduleDropController.getScheduleDropCompletedRecycler
  );

  APP.route("/api/post/lcd/area").post(
    auth.adminPakamValidation,
    CONTROLLER.versionController.submitLCD
  );

  APP.route("/api/get/lcd/areas").get(CONTROLLER.versionController.getLCD);

  APP.route("/api/update/lcd/areas").post(
    auth.companyPakamDataValidation,
    CONTROLLER.versionController.updateLCD
  );
};
