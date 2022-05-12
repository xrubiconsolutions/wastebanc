const { body } = require("express-validator");

module.exports = {
  createCharityOrganisation: [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("provide charity organisation name")
      .isString()
      .withMessage("organisation name must be a string"),
    body("bank")
      .trim()
      .notEmpty()
      .withMessage("provide charity organisation bank name")
      .isString()
      .withMessage("bank name must be a string"),
    body("accountNumber")
      .trim()
      .notEmpty()
      .withMessage("provide charity organisation account number")
      .isString()
      .withMessage("account number must be a string")
      .isLength({
        min: 5,
        max: 17,
      })
      .withMessage("account number length must be from 5 to 17"),
  ],
};
