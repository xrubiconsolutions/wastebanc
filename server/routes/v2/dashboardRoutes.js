const dashboardController = require("../../controllerv2/dashboardController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const { filter: dateCheck } = require("../../validators/commonValidator");

module.exports = (APP) => {
  APP.route("/api/v2/dashboard/matrix").get(
    adminPakamValidation,
    dateCheck,
    checkRequestErrs,
    dashboardController.cardMapData
  );
  APP.route("/api/v2/dashboard/company/matrix").get(
    companyPakamDataValidation,
    dateCheck,
    checkRequestErrs,
    dashboardController.companyCardMapData
  );

  APP.route("/api/v2/dashboard/recentpickup").get(
    adminPakamValidation,
    dashboardController.recentPickups
  );

  APP.route("/api/v2/dashboard/newusers").get(
    adminPakamValidation,
    dashboardController.newUsers
  );

  APP.route("/api/v2/dashboard/newAggregators").get(
    adminPakamValidation,
    dashboardController.newAggregators
  );

  APP.route("/api/v2/collectors/map/data").get(
    adminPakamValidation,
    dateCheck,
    checkRequestErrs,
    dashboardController.collectormapData
  );

  APP.route("/api/v2/waste/chart").get(
    adminPakamValidation,
    dashboardController.chartData
  );
};
