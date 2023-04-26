const dropoffController = require("../../controllerv2/dropoffController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const commonValidator = require("../../validators/commonValidator.js");

const {
  createDropOffLocation,
  deleteDropOff,
  rewardUser,
} = require("../../validators/dropOffValidator");
const { checkRequestErrs } = require("../../util/commonFunction");
const { body, query, check, param } = require("express-validator");
const scheduleValidator = require("../../validators/scheduleValidators");
module.exports = (APP) => {
  APP.route("/api/v2/dropoffs").get(
    adminPakamValidation,
    dropoffController.dropOffs
  );

  APP.route("/api/v2/household/dropoffs").get(
    adminPakamValidation,
    commonValidator.householdScheduleValidation,
    checkRequestErrs,
    dropoffController.userdropOffs
  );

  APP.route("/api/v2/company/dropoffs").get(
    companyPakamDataValidation,
    dropoffController.companydropOffs
  );

  APP.route("/api/v2/company/dropoff").delete(
    companyPakamDataValidation,
    deleteDropOff,
    checkRequestErrs,
    dropoffController.deleteDropOff
  );

  APP.route("/api/v2/company/dropoffs/location").delete(
    companyPakamDataValidation,
    deleteDropOff,
    checkRequestErrs,
    dropoffController.removeDropLocation
  );

  APP.route("/api/v2/company/dropoffs/location").post(
    companyPakamDataValidation,
    createDropOffLocation,
    checkRequestErrs,
    dropoffController.addDropOffLocation
  );

  APP.route("/api/v2/company/dropoffs/rewardUser").post(
    recyclerValidation,
    rewardUser,
    checkRequestErrs,
    dropoffController.rewardDropSystem
  );

  APP.route("/api/submit/drop/request").post(
    scheduleValidator.dropOff,
    checkRequestErrs,
    dropoffController.scheduledropOffs
  );

  APP.route("/api/v2/dropoff/approve").post(
    companyPakamDataValidation,
    scheduleValidator.approveSchedule,
    checkRequestErrs,
    dropoffController.hubConfirmSchedule
  );

  APP.route("/api/v2/dropoff/disapprove").post(
    companyPakamDataValidation,
    scheduleValidator.disapproveSchedule,
    checkRequestErrs,
    dropoffController.hubRejectSchedule
  );

  APP.route("/api/v2/schedule/admin/dropoff/approve").post(
    adminPakamValidation,
    scheduleValidator.approveSchedule,
    checkRequestErrs,
    dropoffController.hubConfirmSchedule
  );
};
