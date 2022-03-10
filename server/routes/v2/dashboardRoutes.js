const dashboardController = require("../../controllerv2/dashboardController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const { filter: dateCheck } = require("../../validators/commonValidator");

module.exports = (APP) => {
  APP.route("/api/v2/dashboard/matrix").get(
    auth.adminPakamValidation,
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
    auth.adminPakamValidation,
    dashboardController.recentPickups
  );
};
