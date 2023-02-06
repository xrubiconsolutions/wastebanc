const { body, param, query } = require("express-validator");

module.exports = {
  charityPay: [
    body("cardID")
      .notEmpty()
      .withMessage("cardID is required")
      .isString()
      .withMessage("cardID should be string"),
    body("amount")
      .notEmpty()
      .withMessage("amount is required")
      .isFloat({ min: 1 })
      .withMessage(
        "amount must be a number and value must greater than or equal to 1"
      ),
    body("charityOrganisationID")
      .notEmpty()
      .withMessage("charityorganisationID is required")
      .isMongoId()
      .withMessage("charityOrganisationID must be a valid id"),
  ],
};
