const { body, param } = require("express-validator");

module.exports = {
  generateInvoice: [
    body("start")
      .notEmpty()
      .withMessage("start is required")
      .isString()
      .withMessage("start should be string"),

    body("end")
      .notEmpty()
      .withMessage("end is required")
      .isString()
      .withMessage("end should be string"),

    body("companyId")
      .notEmpty()
      .withMessage("companyId is required")
      .isString()
      .withMessage("companyId should be string"),
  ],

  invoiceNumber: [
    param("invoiceNumber")
      .notEmpty()
      .withMessage("invoiceNumber is required")
      .isString()
      .withMessage("invoiceNumber should be string"),
  ],
};
