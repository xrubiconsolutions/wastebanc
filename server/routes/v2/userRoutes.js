const UserService = require("../../controllerv2/userController.js");
const { userValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const userValidator = require("../../validators/userValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    userValidator.filter,
    checkRequestErrs,
    UserService.getClients
  );

  //   APP.route("/api/v2/schedules/search").get(
  //     scheduleValidators.searchSchedules,
  //     checkRequestErrs,
  //     ScheduleService.searchSchedules
  //   );
};
