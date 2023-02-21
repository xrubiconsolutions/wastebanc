const { body } = require("express-validator");

const accountTypes = ["organisation", "collector", "client"];
module.exports = {
  usersSMS: [body("message", "Provide message to send").isString().notEmpty()],
  resendMail: [
    body("type")
      .isString()
      .isIn(accountTypes)
      .withMessage(`Account type must be within ${accountTypes}`),
    body("email").isEmail().withMessage("Account email is required"),
  ],
};
