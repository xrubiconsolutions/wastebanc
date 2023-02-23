const ScriptController = require("../../controllerv2/scriptController");
const { adminPakamValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const scriptValidator = require("../../validators/scriptValidators.js");

module.exports = (APP) => {
  APP.route("/api/v2/script/charity").get(ScriptController.charitModelScript);
  APP.route("/api/v2/script/pay").get(ScriptController.payModelScript);
  APP.route("/api/v2/script/scheduleDropoff").get(
    ScriptController.ScheduleDropOffModelScript
  );
  APP.route("/api/v2/script/schedulepickup").get(
    ScriptController.SchedulePickModelScript
  );
  APP.route("/api/v2/script/transactions").get(
    ScriptController.transactionScript
  );
  APP.route("/api/v2/script/users-sms").post(
    adminPakamValidation,
    scriptValidator.usersSMS,
    checkRequestErrs,
    ScriptController.UserSmsScript
  );
  APP.route("/api/v2/script/resend-onboard-mail").get(
    adminPakamValidation,
    scriptValidator.resendMail,
    checkRequestErrs,
    ScriptController.resendOnboardMail
  );
};
