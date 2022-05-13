const { body, check, param, query } = require("express-validator");

module.exports = {
  createOrganisation: [
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
    body("categories.*.name")
      .notEmpty()
      .withMessage("name is required")
      .isString()
      .withMessage("name should be string"),
    body("categories.*.price")
      .notEmpty()
      .withMessage("price is required")
      .isInt()
      .withMessage("price should be string"),
    body("location")
      .notEmpty()
      .withMessage("location is required")
      .isString()
      .withMessage("location should be string"),
  ],

  organisationId: [
    param("organisationId")
      .notEmpty()
      .withMessage("organisationId is required"),
  ],

  organisationType: [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .isString()
      .withMessage("name should be string"),
  ],

  organisationUpdate: [
    param("orgId")
      .notEmpty()
      .withMessage("orgId is required")
      .isString()
      .withMessage("orgId is string"),
    body("categories")
      .optional()
      .isArray()
      .withMessage("categories should be an array"),
    body("categories.*.name")
      .optional()
      .isString()
      .withMessage("name should be string"),
    body("categories.*.price")
      .optional()
      .isInt()
      .withMessage("price should be integer"),
  ],

  companyUpdate: [
    body("categories")
      .optional()
      .isArray()
      .withMessage("categories should be an array"),
    body("categories.*.name")
      .optional()
      .isString()
      .withMessage("name should be string"),
    body("categories.*.price")
      .optional()
      .isInt()
      .withMessage("price should be integer"),
  ],

  organisationAggregators: [
    param("organisation")
      .notEmpty()
      .withMessage("organisation id is required")
      .isString()
      .withMessage("organisation id string"),
  ],

  orgId: [
    param("orgId")
      .notEmpty()
      .withMessage("orgId is required")
      .isString()
      .withMessage("orgId is string"),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("currentPassword is required")
      .isString()
      .withMessage("current password must be a string")
      .isLength({
        min: 6,
      })
      .withMessage("password must be greater than 5 characters"),
    body("newPassword")
      .notEmpty()
      .withMessage("newPassword is required")
      .isString()
      .withMessage("password must be a string")
      .isLength({
        min: 6,
      })
      .withMessage("password must be greater than 5 characters"),
  ],
};
