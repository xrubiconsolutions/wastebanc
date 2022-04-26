const { body, query } = require("express-validator");

const ROLES_ENUM = Object.freeze(["COLLECTOR", "CLIENT", "ADMIN"]);

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
    body("verificationId")
      .trim()
      .notEmpty()
      .withMessage("verificationId is required")
      .isString()
      .withMessage("type must be a string"),
    body("token")
      .trim()
      .notEmpty()
      .withMessage("token is required")
      .isString()
      .withMessage("token must be a string"),
  ],
};
