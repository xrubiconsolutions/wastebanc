const { body, query } = require("express-validator");
const { VERIFICATION_TYPES, ROLES_ENUM } = require("../util/constants");

module.exports = {
  authVerification: [
    body("email")
      .trim()
      .custom((email, { req }) => {
        if (!(email || req.body.phone))
          throw new Error("Email or phone number is required");
        return true;
      }),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isString()
      .withMessage("type must be a string")
      .isIn(ROLES_ENUM)
      .withMessage(`Role must be among: ${ROLES_ENUM}`),
  ],
  verifyToken: [
    body("email")
      .trim()
      .custom((email, { req }) => {
        if (!(email || req.body.phone))
          throw new Error("Email or phone number is required");
        return true;
      }),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isString()
      .withMessage("type must be a string")
      .isIn(ROLES_ENUM)
      .withMessage(`Role must be among: ${ROLES_ENUM}`),
    body("verificationType")
      .trim()
      .notEmpty()
      .withMessage("verificationType is required")
      .isIn(VERIFICATION_TYPES)
      .withMessage(`Type must be among: ${VERIFICATION_TYPES}`),
    body("token")
      .trim()
      .notEmpty()
      .withMessage("token is required")
      .isString()
      .withMessage("token must be a string"),
  ],
  OtpRequest: [
    body("type")
      .trim()
      .notEmpty()
      .withMessage("type is required")
      .isIn(["gain", "charity"]),

    body("destinationAccount")
      .trim()
      .notEmpty()
      .withMessage("destinationAccount is required"),

    body("destinationBankCode")
      .trim()
      .notEmpty()
      .withMessage("destinationBankCode is required"),

    // body("amount")
    //   .trim()
    //   .notEmpty()
    //   .withMessage("amount is required")
    //   .isInt()
    //   .withMessage("amount should be a number"),

    body("bankName")
      .trim()
      .notEmpty()
      .withMessage("bankName is required")
      .isString(),

    // body("charge").trim().notEmpty().withMessage("charge is required").isInt(),
    body("nesidNumber").trim().optional(),
    body("nerspNumber").trim().optional(),
    body("kycLevel").trim().optional(),
  ],
  ConfirmOtp: [
    body("requestId")
      .trim()
      .notEmpty()
      .withMessage("requestId is required")
      .isString()
      .withMessage("requestId should be string"),

    body("otp")
      .trim()
      .notEmpty()
      .withMessage("otp is required")
      .isString()
      .withMessage("otp is should be string"),
  ],
};
