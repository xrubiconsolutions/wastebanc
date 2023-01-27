const ScriptController = require("../../controllerv2/scriptController");
module.exports = (APP) => {
  APP.route("/api/v2/script/charity").get(ScriptController.charitModelScript);
  APP.route("/api/v2/script/pay").get(ScriptController.payModelScript);
  APP.route("/api/v2/script/scheduleDropoff").get(
    ScriptController.ScheduledropoffModelScript
  );
};
