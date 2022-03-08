const CollectorService = require("../../controllerv2/collectorController.js");
const { userValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/collectors").get(
    commonValidator.filter,
    checkRequestErrs,
    CollectorService.getCollectors
  );

  APP.route("/api/v2/collectors/search").get(
    commonValidator.search,
    checkRequestErrs,
    CollectorService.searchCollectors
  );
};
