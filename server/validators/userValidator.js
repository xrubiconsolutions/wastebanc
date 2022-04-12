const { body, param } = require("express-validator");

module.exports = {
  login: [
    body("email", "email is required").isString(),
    body("password", "password is required").isString(),
  ],

  userAgencies: [
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

  findAgencies: [
    param("agencyId").notEmpty().withMessage("agencyId is required"),
  ],

  updateAgencies: [
    param("agencyId").notEmpty().withMessage("agencyId is required"),
  ],
};
