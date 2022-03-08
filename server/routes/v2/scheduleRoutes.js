const ScheduleService = require("../../controllerv2/scheduleController.js");
const { userValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/schedules").get(
    commonValidator.filter,
    checkRequestErrs,
    ScheduleService.getSchedulesWithFilter
  );

  APP.route("/api/v2/schedules/search").get(
    commonValidator.search,
    checkRequestErrs,
    ScheduleService.searchSchedules
  );
};
