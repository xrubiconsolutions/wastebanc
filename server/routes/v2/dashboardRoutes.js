const dashboardController = require("../../controllerv2/dashboardController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const { adminPakamValidation } = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const { filter: dateCheck } = require("../../validators/commonValidator");

module.exports = (APP) => {
  APP.route("/api/v2/dashboard/matrix").get(
    adminPakamValidation,
    [
      query("start").notEmpty().withMessage("start is required"),
      query("end").notEmpty().withMessage("end is required"),
    ],
    dashboardController.cardMapData
  );
  APP.route("/api/v2/dashboard/company/matrix").get(
    auth.recyclerValidation,
    dateCheck,
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
};
