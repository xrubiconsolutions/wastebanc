const ScheduleService = require("../../controllerv2/scheduleController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
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
};
