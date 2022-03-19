"use strict";
const organisationController = require("../../controllerv2/organisationController");
const { adminPakamValidation } = require("../../util/auth");
const { bodyValidate } = require("../../util/commonFunction");

module.exports = (APP) => {
  APP.route("/api/v2/waste/collection").get(
    adminPakamValidation,
    organisationController.getOrganisationCompleted
  );

  APP.route("/api/v2/organisations").get(
    adminPakamValidation,
    organisationController.listOrganisation
  );
};
