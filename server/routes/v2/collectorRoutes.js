const CollectorService = require("../../controllerv2/collectorController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const collectorValidator = require("../../validators/collectorValidator.js");
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
  APP.route("/api/v2/company-collectors").get(
    companyPakamDataValidation,
    CollectorService.getCompanyCollectors
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

  APP.route("/api/v2/company-collectors/approve").put(
    companyPakamDataValidation,
    collectorValidator.verifyCollector,
    checkRequestErrs,
    CollectorService.approveCollector
  );

  APP.route("/api/v2/company-collectors/decline").put(
    companyPakamDataValidation,
    collectorValidator.verifyCollector,
    checkRequestErrs,
    CollectorService.declineCollector
  );

  APP.route("/api/v2/collector/enable/:collectorId").put(
    [param("collectorId").notEmpty().withMessage("collectorId is required")],
    adminPakamValidation,
    CollectorService.enableCollector
  );

  APP.route("/api/v2/collector/disable/:collectorId").put(
    [param("collectorId").notEmpty().withMessage("collectorId is required")],
    adminPakamValidation,
    CollectorService.disableCollector
  );

  APP.route("/api/collector/register").post(
    [
      body("fullname").notEmpty().withMessage("fullname is required"),
      body("email").optional("").isEmail().withMessage("Enter is valid email"),
      body("phone").notEmpty().withMessage("phone is required"),
      body("password").notEmpty().withMessage("password is required"),
      body("gender").notEmpty().withMessage("gender is required"),
      body("state").notEmpty().withMessage("state is required"),
      body("country").notEmpty().withMessage("country is required"),
      body("organisation").notEmpty().withMessage("organisation is required"),
    ],
    CollectorService.register
  );

  APP.route("/api/v2/company-collectors/stats").get(
    companyPakamDataValidation,
    CollectorService.getCompanyCollectorStats
  );

  APP.route("/api/v2/company-waste/history").get(
    companyPakamDataValidation,
    CollectorService.getCompanyWasteTransaction
  );

  APP.route("/api/v2/company-waste/stats").get(
    companyPakamDataValidation,
    CollectorService.getCompanyWasteStats
  );
};
