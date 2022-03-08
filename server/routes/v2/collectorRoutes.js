const CollectorService = require("../../controllerv2/collectorController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/collectors").get(
    adminAuthorization(),
    commonValidator.filter,
    checkRequestErrs,
    CollectorService.getCollectors
  );

  APP.route("/api/v2/collectors/search").get(
    adminAuthorization(),
    commonValidator.search,
    checkRequestErrs,
    CollectorService.searchCollectors
  );
};
