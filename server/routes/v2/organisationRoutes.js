"use strict";
const organisationController = require("../../controllerv2/organisationController");
const { adminPakamValidation } = require("../../util/auth");
// const { bodyValidate } = require("../../util/commonFunction");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
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
    [
      body("companyName")
        .notEmpty()
        .withMessage("companyName is required")
        .isString()
        .withMessage("companyName should be string"),
      body("email")
        .notEmpty()
        .withMessage("email is required")
        .isEmail()
        .withMessage("Enter a valid email"),
      body("rcNo")
        .notEmpty()
        .withMessage("rcNo is required")
        .isString()
        .withMessage("rcNo should be string"),
      body("companyTag")
        .notEmpty()
        .withMessage("companyTag is required")
        .isString()
        .withMessage("companyTag should be string"),
      body("phone")
        .notEmpty()
        .withMessage("phone is required")
        .isNumeric()
        .withMessage("phone should be a numeric string"),
      body("areaOfAccess")
        .notEmpty()
        .withMessage("areaOfAccess is required")
        .isArray()
        .withMessage("areaOfAccess should be an array"),
      body("streetOfAccess")
        .notEmpty()
        .withMessage("streetOfAccess is required")
        .isArray()
        .withMessage("streetOfAccess should be an array"),
      body("categories")
        .notEmpty()
        .withMessage("categories is required")
        .isArray()
        .withMessage("categories should be an array"),
      body("location")
        .notEmpty()
        .withMessage("location is required")
        .isString()
        .withMessage("location should be string"),
    ],
    organisationController.create
  );

  APP.route("/api/v2/organisation/:organisationId").get(
    adminPakamValidation,
    [
      param("organisationId")
        .notEmpty()
        .withMessage("organisationId is required"),
    ],
    organisationController.findOrganisation
  );
};
