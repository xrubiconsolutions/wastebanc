const { body } = require("express-validator");
const { WORK_TYPE_ENUM, NEWS_CATEGORY_ENUM } = require("../util/constants");

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

  newsValidation: [
    body("headline", "News headline is required")
      .notEmpty()
      .isString()
      .withMessage("News headline must be a string")
      .isLength({ min: 5, max: 255 })
      .withMessage("Headline length should be between 5 and 255 characters"),
    body("category", "News Category is required")
      .notEmpty()
      .isIn(NEWS_CATEGORY_ENUM)
      .withMessage(`News category type must be within ${NEWS_CATEGORY_ENUM}`),
    body("body").custom((val, { req }) => {
      if (NEWS_CATEGORY_ENUM.slice(0, 2).includes(req.body.category) && !val) {
        throw new Error("News body cannot be empty for this category");
      }
      return true;
    }),
    body("contentUrl").custom((val, { req }) => {
      if (NEWS_CATEGORY_ENUM[1] !== req.body.category && !val) {
        console.log(req.body);
        throw new Error("News content url cannot be empty for this category");
      }
      return true;
    }),
    body("imageUrl").custom((val, { req }) => {
      if (NEWS_CATEGORY_ENUM[2] !== req.body.category && !val) {
        throw new Error("News image url cannot be empty for this category");
      }
      return true;
    }),
  ],
};
