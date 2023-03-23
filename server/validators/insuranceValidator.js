const { body, param } = require("express-validator");

module.exports = {
  purchaseHealthInsuranceValidator: [
    body("plan_duration")
      .notEmpty()
      .withMessage("plan_duration is required")
      .isInt(),
    body("gender")
      .notEmpty()
      .withMessage("gender is required")
      .isString()
      .withMessage("gender should be either Male or Female"),
    body("image_url")
      .notEmpty()
      .withMessage("image_url is required")
      .isURL()
      .withMessage("image_url should be a valid url"),
    body("first_name")
      .notEmpty()
      .withMessage("first_name is required")
      .isString()
      .withMessage("first_name should be a valid string"),
    body("last_name")
      .notEmpty()
      .withMessage("last_name is required")
      .isString()
      .withMessage("last_name should be a valid string"),
    body("email").notEmpty().withMessage("email is required").isEmail(),
    body("dob")
      .notEmpty()
      .withMessage("dob is required")
      .isString("Enter a string of date with format 2000-10-10"),
    body("phone").notEmpty().withMessage("phone number is required").isString(),
    body("product_id")
      .notEmpty()
      .withMessage("product_id is required")
      .isUUID(),
    body("price").notEmpty().withMessage("price is required").isString(),
  ],
};
