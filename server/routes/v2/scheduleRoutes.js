const ScheduleService = require("../../controllerv2/scheduleController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/schedules").get(
    adminAuthorization(),
    commonValidator.filter,
    checkRequestErrs,
    ScheduleService.getSchedulesWithFilter
  );

  APP.route("/api/v2/schedules/search").get(
    adminAuthorization(),
    commonValidator.search,
    checkRequestErrs,
    ScheduleService.searchSchedules
  );
};
