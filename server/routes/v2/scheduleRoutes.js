const ScheduleService = require("../../controllerv2/scheduleController.js");
const { userValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const scheduleValidators = require("../../validators/scheduleValidators");

module.exports = (APP) => {
  APP.route("/api/v2/schedules").get(
    scheduleValidators.filterSchedules,
    checkRequestErrs,
    ScheduleService.getSchedulesWithFilter
  );

  APP.route("/api/v2/schedules/search").get(
    scheduleValidators.searchSchedules,
    checkRequestErrs,
    ScheduleService.searchSchedules
  );
};
