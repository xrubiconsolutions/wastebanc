const CollectorService = require("../../controllerv2/collectorController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const auth = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/collectors").get(
    auth.adminPakamValidation,
    CollectorService.getCollectors
  );

  APP.route("/api/v2/collectors/search").get(
    auth.adminPakamValidation,
    commonValidator.search,
    checkRequestErrs,
    CollectorService.searchCollectors
  );

  APP.route("/api/v2/collectors/geofence").get(
    auth.companyPakamDataValidation,
    CollectorService.getGeoFencedCoordinates
  );

  APP.route("/api/v2/collectors/schedules/pending").get(
    auth.companyPakamDataValidation,
    CollectorService.getOrganisationPendingSchedules
  );
};
