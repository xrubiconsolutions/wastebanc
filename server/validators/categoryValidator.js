const { body, param } = require("express-validator");

module.exports = {
  createCategory: [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .isString()
      .withMessage("name should be string"),
    body("wastepicker")
      .optional()
      .withMessage("wastepicker is required")
      .isInt()
      .withMessage("wastepicker should be number"),
  ],

  updateCategory: [
    body("name").optional().isString().withMessage("name should be string"),
    body("wastepicker")
      .optional()
      .isInt()
      .withMessage("wastepicker should be number"),
    param("catId").notEmpty().withMessage("catId is required"),
  ],

  categoryId: [param("catId").notEmpty().withMessage("catId is required")],
};
