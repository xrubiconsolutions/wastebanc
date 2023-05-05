const EvacuationService = require("../../controllerv2/evacuationController.js");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/evacuation/request").get(
    recyclerValidation,
    EvacuationService.requestEvacuation
  );
};
