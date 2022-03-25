const UserService = require("../../controllerv2/userController.js");

const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const { adminPakamValidation, userValidation } = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    adminPakamValidation,
    // commonValidator.filter,
    // checkRequestErrs,
    UserService.getClients
  );

  APP.route("/api/v2/clients/search").get(
    adminPakamValidation,
    // commonValidator.search,
    // checkRequestErrs,
    UserService.searchClients
  );

  APP.route("/api/register").post(
    [
      body("fullname")
        .notEmpty()
        .withMessage("fullname is required")
        .isString()
        .withMessage("fullname should be string"),
      body("phone")
        .notEmpty()
        .withMessage("phone is required")
        .isNumeric()
        .withMessage("phone should be numeric string"),
      body("email").optional().isEmail().withMessage("Enter a valid email"),
      body("gender")
        .notEmpty()
        .withMessage("gender is required")
        .isIn(["male", "female", "prefer not to say"]),
      body("country").notEmpty().withMessage("country is required"),
      body("state").notEmpty().withMessage("state is required"),
      body("lga").notEmpty().withMessage("lga is required"),
      body("uType").notEmpty().withMessage("uType is required"),
      body("organisation").optional(),
    ],
    UserService.register
  );

  APP.route("/api/v2/reportlogs").get(
    adminPakamValidation,
    UserService.getAllUserReportLogs
  );

  APP.route("/api/v2/user/reportlogs").get(
    userValidation,
    UserService.getUserReportLogs
  );
};
