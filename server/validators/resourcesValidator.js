const { body, query, param } = require("express-validator");

module.exports = {
  addResource: [
    body("title")
      .notEmpty()
      .withMessage("title is required")
      .isString()
      .withMessage("title is required"),
    body("message")
      .notEmpty()
      .withMessage("message is required")
      .isString()
      .withMessage("message is required"),
    // body("url")
    //   .notEmpty()
    //   .withMessage("url is required")
    //   .isString()
    //   .withMessage("url is string"),
    body("youtubeId").notEmpty().withMessage("youtubeId is required"),
  ],

  resourceId: [
    param("resourceId")
      .notEmpty()
      .withMessage("resourceId is required")
      .isString()
      .withMessage("resourceId should be string"),
  ],
};
