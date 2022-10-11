const CollectorService = require("../../controllerv2/collectorController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const collectorValidator = require("../../validators/collectorValidator.js");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const userValidator = require("../../validators/userValidator");

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
    checkRequestErrs,
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
    // [param("collectorId").notEmpty().withMessage("collectorId is required")],
    adminPakamValidation,
    collectorValidator.checkCollectorId,
    checkRequestErrs,
    CollectorService.enableCollector
  );

  APP.route("/api/v2/collector/disable/:collectorId").put(
    //[param("collectorId").notEmpty().withMessage("collectorId is required")],
    adminPakamValidation,
    collectorValidator.checkCollectorId,
    checkRequestErrs,
    CollectorService.disableCollector
  );

  // enable collector on company dashboard
  APP.route("/api/v2/company/collector/enable/:collectorId").put(
    // [param("collectorId").notEmpty().withMessage("collectorId is required")],
    companyPakamDataValidation,
    collectorValidator.checkCollectorId,
    checkRequestErrs,
    CollectorService.enableCollector
  );

  // disable collector on company dashboard
  APP.route("/api/v2/company/collector/disable/:collectorId").put(
    //[param("collectorId").notEmpty().withMessage("collectorId is required")],
    companyPakamDataValidation,
    collectorValidator.checkCollectorId,
    checkRequestErrs,
    CollectorService.disableCollector
  );

  APP.route("/api/collector/register").post(
    collectorValidator.createCollector,
    checkRequestErrs,
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

  APP.route("/api/v2/collector/pickups").get(
    recyclerValidation,
    CollectorService.getCollectorPickups
  );

  APP.route("/api/v2/collector/pickups").get(
    recyclerValidation,
    CollectorService.getCollectorPickups
  );

  APP.route("/api/v2/collector/dropoff-locations").get(
    companyPakamDataValidation,
    CollectorService.getCompanyDropOffLocations
  );

  APP.route("/api/collector/verify").post(
    collectorValidator.verifyOTP,
    checkRequestErrs,
    CollectorService.verifyOTP
  );

  APP.route("/api/collector/login").post(CollectorService.login);

  APP.route("/api/collector/update").post(
    recyclerValidation,
    collectorValidator.updateCollector,
    checkRequestErrs,
    CollectorService.updateCollector
  );
  APP.route("/api/collector/recent/transactions").get(
    recyclerValidation,
    CollectorService.recentTransaction
  );

  APP.route("/api/collector/script").get(CollectorService.assignOrganisationId);

  APP.route("/api/wastepicker/register").post(
    adminPakamValidation,
    collectorValidator.createPicker,
    checkRequestErrs,
    CollectorService.registerPicker
  );

  APP.route("/api/wastepicker/assign").post(
    adminPakamValidation,
    collectorValidator.assignPicker,
    checkRequestErrs,
    CollectorService.assignToOrganiation
  );

  APP.route("/api/wastepicker/unassign").post(
    adminPakamValidation,
    collectorValidator.unassignPicker,
    checkRequestErrs,
    CollectorService.unassignFromOrganisation
  );

  APP.route("/api/collector/changepassword").post(
    collectorValidator.changePassword,
    checkRequestErrs,
    CollectorService.changePassword
  );

  APP.route("/api/collector/point/balance").get(
    recyclerValidation,
    CollectorService.collectorPointBalance
  );

  // deleting of collectors
  APP.route("/api/collector/remove/:collectorId").delete(
    adminPakamValidation,
    collectorValidator.checkCollectorId,
    checkRequestErrs,
    CollectorService.removeCollector
  );

  APP.route("/api/collector/accept/termscondition").post(
    collectorValidator.termsCondition,
    checkRequestErrs,
    CollectorService.acceptTermsCondition
  );

  APP.route("/api/collector/payment/summary").get(
    recyclerValidation,
    CollectorService.requestSummary
  );

  APP.route("/api/collector/request/otp").post(
    recyclerValidation,
    CollectorService.requestOTP
  );

  APP.route("/api/collector/initiate/payment").post(
    recyclerValidation,
    collectorValidator.initiatePayment,
    checkRequestErrs,
    CollectorService.initiatePayment
  );

  APP.route("/api/collector/delete").post(
    recyclerValidation,
    CollectorService.removeUser
  );

  APP.route("/api/collector/wastebanc-agent").post(
    collectorValidator.wastebancAgent,
    checkRequestErrs,
    CollectorService.saveWasteBancAgent
  );
};
