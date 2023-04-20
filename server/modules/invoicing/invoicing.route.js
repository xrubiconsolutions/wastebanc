const invoiceController = require("./invoicing.controller");
const {
  adminPakamValidation,
  companyPakamDataValidation,
} = require("../../util/auth");
const {
  generateInvoice,
  invoiceNumber,
  invoiceId,
  companyId,
} = require("./invoicingValidation");
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

  APP.route("/api/generate/invoicepdf/:invoiceNumber").get(
    //adminPakamValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.invoicePDF
  );

  APP.route("/api/company/generate/invoicepdf/:invoiceNumber").get(
    //companyPakamDataValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.invoicePDF
  );

  APP.route("/api/invoice/summary").get(
    adminPakamValidation,
    invoiceController.cardData
  );

  APP.route("/api/invoice/:invoiceNumber/markAsPaid").get(
    adminPakamValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.markInvoice
  );

  APP.route("/api/invoice/outstanding/payment").get(
    adminPakamValidation,
    invoiceController.outstandingInvoicePayments
  );

  APP.route("/api/invoice/completed/payment").get(
    adminPakamValidation,
    invoiceController.completedInvoicePayments
  );

  APP.route("/api/invoice/:invoiceId").get(
    adminPakamValidation,
    invoiceId,
    checkRequestErrs,
    invoiceController.fetchInvoice
  );

  APP.route("/api/invoice/company/history").get(
    companyPakamDataValidation,
    invoiceController.fetchCompanyInvoiceRecord
  );

  APP.route("/api/invoice/:companyId/history").get(
    adminPakamValidation,
    companyId,
    checkRequestErrs,
    invoiceController.fetchInvoiceRecord
  );

  APP.route("/api/invoice/:invoiceNumber").delete(
    adminPakamValidation,
    invoiceNumber,
    checkRequestErrs,
    invoiceController.deleteInvoice
  );
};
