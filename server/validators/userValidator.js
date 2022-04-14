const { body, param, query } = require("express-validator");

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

  storeactivites: [
    body("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId should be string"),
    body("message")
      .notEmpty()
      .withMessage("message is required")
      .isString()
      .withMessage("message should be string"),
    body("type")
      .optional({ default: "collector" })
      .isString()
      .withMessage("type should be string"),
    body("activity_type")
      .notEmpty()
      .withMessage("activity_type is required")
      .isString()
      .withMessage("activity_type should be string"),
  ],

  getActivites: [
    param("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId should be string"),
    query("type")
      .notEmpty()
      .withMessage("type is required")
      .isString()
      .withMessage("type should be string"),
  ],

  locationScope: [
    query("scope")
      .notEmpty()
      .withMessage("location scope is required in query params")
      .isString()
      .withMessage("location scope must be a string"),
  ],
};
