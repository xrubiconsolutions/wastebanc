const dropoffController = require("../../controllerv2/dropoffController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const {
  createDropOffLocation,
  deleteDropOff,
} = require("../../validators/dropOffValidator");
const { checkRequestErrs } = require("../../util/commonFunction");

module.exports = (APP) => {
  APP.route("/api/v2/dropoffs").get(
    adminPakamValidation,
    dropoffController.dropOffs
  );

  APP.route("/api/v2/company/dropoffs").get(
    companyPakamDataValidation,
    dropoffController.companydropOffs
  );

  APP.route("/api/v2/company/dropoff").delete(
    companyPakamDataValidation,
    deleteDropOff,
    checkRequestErrs,
    dropoffController.deleteDropOff
  );

  APP.route("/api/v2/company/dropoffs/location").post(
    companyPakamDataValidation,
    createDropOffLocation,
    checkRequestErrs,
    dropoffController.addDropOffLocation
  );
};
