const { body } = require("express-validator");

module.exports = {
  faqValidation: [
    body("question", "Question is required").notEmpty().isString(),
    body("answer", "Answer is required").notEmpty().isString(),
  ],
};
