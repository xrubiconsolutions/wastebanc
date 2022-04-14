const ScheduleService = require("../../controllerv2/scheduleController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const { body, query, check, param } = require("express-validator");
const scheduleValidator = require("../../validators/scheduleValidators");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/schedules").get(
    adminPakamValidation,
    // commonValidator.filter,
    // checkRequestErrs,
    ScheduleService.getSchedulesWithFilter
  );

  APP.route("/api/v2/schedules/search").get(
    adminPakamValidation,
    commonValidator.search,
    checkRequestErrs,
    ScheduleService.searchSchedules
  );

  APP.route("/api/v2/company-schedules/").get(
    companyPakamDataValidation,
    checkRequestErrs,
    ScheduleService.getCompanySchedules
  );

  APP.route("/api/v2/rewardUser").post(
    recyclerValidation,
    scheduleValidator.rewardUser,
    checkRequestErrs,
    ScheduleService.rewardSystem
  );

  APP.route("/api/geofenced/schedule").get(
    recyclerValidation,
    ScheduleService.smartRoute
  );

  APP.route("/api/schedule").post(
    userValidation,
    scheduleValidator.bookPickUp,
    checkRequestErrs,
    ScheduleService.pickup
  );
};
