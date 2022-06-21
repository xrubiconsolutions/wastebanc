const invoiceController = require("./invoicing.controller");
const {
  adminPakamValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const { generateInvoice, invoiceNumber } = require("./invoicingValidation");
const { checkRequestErrs } = require("../../util/commonFunction.js");

module.exports = (APP) => {
  APP.route("/api/invoice/generate").post(
    adminPakamValidation,
    generateInvoice,
    checkRequestErrs,
    invoiceController.createInvoice
  );

  APP.route("/api/invoice/send/:invoiceNumber").get(
    adminPakamValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.sendInvoice
  );

  APP.route("/api/invoice/summary").get(
    adminPakamValidation,
    invoiceController.cardData
  );

  // mark as paid
  APP.route("/api/invoice/:invoiceNumber/markAsPaid").get(
    adminPakamValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.markInvoice
  );
};
