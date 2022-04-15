"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const userValidator = require("../../validators/userValidator.js");
const { checkRequestErrs } = require("../../util/commonFunction");

module.exports = (APP) => {
  APP.route("/api/user/agencies/create").post(
    auth.adminPakamValidation,
    userValidator.userAgencies,
    checkRequestErrs,
    controller.userAgenciesController.create
  );

  APP.route("/api/user/agencies/get").get(
    auth.adminPakamValidation,
    controller.userAgenciesController.getAgencies
  );
  APP.route("/api/user/agencies/find/:agencyId").get(
    auth.adminPakamValidation,
    userValidator.findAgencies,
    checkRequestErrs,
    controller.userAgenciesController.findAgencies
  );
  APP.route("/api/user/agencies/update/:agencyId").put(
    auth.adminPakamValidation,
    userValidator.updateAgencies,
    checkRequestErrs,
    controller.userAgenciesController.updateAgencies
  );
  APP.route("/api/user/agencies/remove/:agencyId").delete(
    auth.adminPakamValidation,
    userValidator.findAgencies,
    checkRequestErrs,
    controller.userAgenciesController.remove
  );
  APP.route("/api/user/agencies/location-scope")
    .get(
      auth.adminPakamValidation,
      controller.userAgenciesController.getLocationScope
    )
    .put(
      auth.adminPakamValidation,
      userValidator.locationScope,
      checkRequestErrs,
      controller.userAgenciesController.setLocationScope
    );

  APP.route("/api/user/agency-profile").get(
    auth.adminPakamValidation,
    controller.userAgenciesController.getAgencyProfile
  );
};
