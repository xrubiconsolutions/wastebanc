const CollectorService = require("../../controllerv2/collectorController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  // APP.route("/api/v2/collectors/map/data").get(
  //   adminPakamValidation,
  //   [
  //     query("start").notEmpty().withMessage("start is required"),
  //     query("end").notEmpty().withMessage("end is required"),
  //   ],
  //   CollectorService.mapCardData
  // );
  APP.route("/api/v2/collectors").get(
    adminPakamValidation,
    commonValidator.filter,
    //checkRequestErrs,
    CollectorService.getCollectors
  );

  APP.route("/api/v2/collectors/search").get(
    adminPakamValidation,
    commonValidator.search,
    checkRequestErrs,
    CollectorService.searchCollectors
  );

  APP.route("/api/v2/collectors/geofence").get(
    companyPakamDataValidation,
    CollectorService.getGeoFencedCoordinates
  );

  APP.route("/api/v2/collectors/schedules/pending").get(
    companyPakamDataValidation,
    CollectorService.getOrganisationPendingSchedules
  );
};
