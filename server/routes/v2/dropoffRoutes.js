const dropoffController = require("../../controllerv2/dropoffController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/dropoffs").get(
    adminPakamValidation,
    dropoffController.dropOffs
  );

  APP.route("/api/v2/company/dropoffs").get(
    companyPakamDataValidation,
    dropoffController.companydropOffs
  );
};
