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
      .isIn(["bank", "charity"]),
  ],
};
