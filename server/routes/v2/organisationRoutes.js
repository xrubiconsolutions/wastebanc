"use strict";
const organisationController = require("../../controllerv2/organisationController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");
// const { bodyValidate } = require("../../util/commonFunction");
const { body, query, check, param } = require("express-validator");
const organisationValidators = require("../../validators/organisationValidators");
const { companyId } = require("../../validators/commonValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");

module.exports = (APP) => {
  APP.route("/api/v2/organisation/update-password").put(
    companyPakamDataValidation,
    organisationValidators.changePassword,
    checkRequestErrs,
    organisationController.changePassword
  );

  APP.route("/api/v2/organisation/update").put(
    companyPakamDataValidation,
    organisationValidators.organisationUpdate,
    checkRequestErrs,
    organisationController.updateProfile
  );

  APP.route("/api/v2/waste/collection").get(
    adminPakamValidation,
    organisationController.getOrganisationCompleted
  );

  APP.route("/api/v2/organisations").get(
    adminPakamValidation,
    organisationController.listOrganisation
  );

  APP.route("/api/v2/organisation/create").post(
    adminPakamValidation,
    organisationValidators.createOrganisation,
    checkRequestErrs,
    organisationController.create
  );

  APP.route("/api/v2/organisation/:organisationId").get(
    adminPakamValidation,
    organisationValidators.organisationId,
    checkRequestErrs,
    organisationController.findOrganisation
  );

  APP.route("/api/v2/organisation/types/all").get(organisationController.types);

  APP.route("/api/v2/organisation/type/create").post(
    adminPakamValidation,
    organisationValidators.organisationType,
    checkRequestErrs,
    organisationController.createtype
  );

  APP.route("/api/v2/organisation/:orgId").put(
    adminPakamValidation,
    organisationValidators.organisationUpdate,
    checkRequestErrs,
    organisationController.update
  );

  APP.route("/api/v2/organisation/aggregators/:organisation").get(
    adminPakamValidation,
    organisationValidators.organisationAggregators,
    checkRequestErrs,
    organisationController.aggregators
  );

  APP.route("/api/v2/organisation/remove/:orgId").delete(
    adminPakamValidation,
    organisationValidators.orgId,
    checkRequestErrs,
    organisationController.remove
  );

  APP.route("/api/v2/organisation/dropoff/locations").get(
    adminPakamValidation,
    organisationController.dropOffPakam
  );

  APP.route("/api/v2/organisation/disable/:companyId").put(
    adminPakamValidation,
    companyId,
    checkRequestErrs,
    organisationController.disableCompany
  );

  APP.route("/api/v2/organisation/enable/:companyId").put(
    adminPakamValidation,
    companyId,
    checkRequestErrs,
    organisationController.enableCompany
  );
};
