const ScheduleService = require("../../controllerv2/scheduleController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const { body, query, check, param } = require("express-validator");

const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
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
    [
      body("collectorId").notEmpty().withMessage("collectorId is required"),
      body("categories")
        .notEmpty()
        .withMessage("categories")
        .isArray()
        .withMessage("categories is an array"),
      body("scheduleId").notEmpty().withMessage("scheduleId is required"),
    ],
    ScheduleService.rewardSystem
  );
};
