const EvacuationService = require("../../controllerv2/evacuationController.js");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const { statusUpdate } = require("../../validators/evacuationValidator");

module.exports = (APP) => {
  APP.route("/api/evacuation/request").get(
    recyclerValidation,
    EvacuationService.requestEvacuation
  );

  APP.route("/api/evacuation/all").get(
    adminPakamValidation,
    EvacuationService.getEvacuationRequests
  );

  APP.route("/api/evacuation/status/:action/:requestId").get(
    adminPakamValidation,
    statusUpdate,
    checkRequestErrs,
    EvacuationService.updateRequestStatus
  );

  APP.route("/api/company/evacuation/all").get(
    companyPakamDataValidation,
    EvacuationService.getEvacuationRequests
  );

  APP.route("/api/company/evacuation/status/:action/:requestId").get(
    companyPakamDataValidation,
    statusUpdate,
    checkRequestErrs,
    EvacuationService.updateRequestStatus
  );
};
