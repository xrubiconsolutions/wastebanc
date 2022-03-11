"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/user/agencies/create").post(
    auth.adminPakamValidation,
    [
      body("name")
        .notEmpty()
        .withMessage("name is required")
        .isString()
        .withMessage("name should be string"),
      body("email").notEmpty().withMessage("email is required"),
      body("countries")
        .notEmpty()
        .withMessage("countries is required")
        .isArray()
        .withMessage("countries should be array"),
      body("states")
        .notEmpty()
        .withMessage("states is required")
        .isArray()
        .withMessage("states should be array"),
      body("role")
        .notEmpty()
        .withMessage("role is required")
        .isString()
        .withMessage("role should be string"),
      body("phone")
        .notEmpty()
        .withMessage("phone is required")
        .isNumeric()
        .withMessage("phone is number"),
    ],
    controller.userAgenciesController.create
  );

  APP.route("/api/user/agencies/get").get(
    auth.adminPakamValidation,
    controller.userAgenciesController.getAgencies
  );
  APP.route("/api/user/agencies/find/:agencyId").get(
    auth.adminPakamValidation,
    [param("agencyId").notEmpty().withMessage("agencyId is required")],
    controller.userAgenciesController.findAgencies
  );
  APP.route("/api/user/agencies/update/:agencyId").put(
    auth.adminPakamValidation,
    [param("agencyId").notEmpty().withMessage("agencyId is required")],
    controller.userAgenciesController.updateAgencies
  );
  APP.route("/api/user/agencies/remove/:agencyId").delete(
    auth.adminPakamValidation,
    [param("agencyId").notEmpty().withMessage("agencyId is required")],
    controller.userAgenciesController.remove
  );
};
