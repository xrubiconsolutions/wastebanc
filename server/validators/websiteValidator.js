const { body } = require("express-validator");
const { WORK_TYPE_ENUM } = require("../util/constants");

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

module.exports = {
  faqValidation: [
    body("question", "Question is required").notEmpty().isString(),
    body("answer", "Answer is required").notEmpty().isString(),
  ],
  careerAdValidation: [
    body("title", "Job title is required")
      .notEmpty()
      .isString()
      .withMessage("Title can only be a string"),
    body("workType", "Work type is required")
      .notEmpty()
      .isString()
      .withMessage("Work type can only be a string")
      .isIn(WORK_TYPE_ENUM)
      .withMessage(`Wrok type must be within ${WORK_TYPE_ENUM}`),
    body("expirationDate", "Expiration date is required")
      .notEmpty()
      .isDate()
      .withMessage("Expiration date must be a date")
      .custom((date) => {
        if (new Date(date) < tomorrow)
          throw new Error("Expiration date must be greater than today");
        return true;
      }),
    body("mission", "Mission is required")
      .notEmpty()
      .isArray()
      .withMessage("Mission must be an array of string")
      .custom((value) => {
        if (Array.isArray(value) && value.every((a) => !!a)) return true;
        throw new Error(
          "mission must be a string or array of non-empty string"
        );
      }),
    body("responsibilities", "responsibilities is required")
      .notEmpty()
      .isArray()
      .withMessage("responsibilities must be an array of string")
      .custom((value) => {
        if (Array.isArray(value) && value.every((a) => !!a)) return true;
        throw new Error(
          "responsibilities must be a string or array of non-empty string"
        );
      }),
    body("requirements", "requirements is required")
      .notEmpty()
      .isArray()
      .withMessage("requirements must be an array of string")
      .custom((value) => {
        if (Array.isArray(value) && value.every((a) => !!a)) return true;
        throw new Error(
          "requirements must be a string or array of non-empty string"
        );
      }),
  ],
};
