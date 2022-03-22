const paymentController = require("../../controllerv2/paymentController");
const {
  adminPakamValidation,
  companyPakamDataValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/payment/history").get(
    adminPakamValidation,
    paymentController.paymentHistory
  );

  APP.route("/api/v2/payment/outstanding").get(
    companyPakamDataValidation,
    paymentController.getCompanyOutstanding
  );

  APP.route("/api/v2/charity/history").get(
    adminPakamValidation,
    paymentController.charityHistory
  );

  APP.route("/api/v2/company-charity/history").get(
    companyPakamDataValidation,
    paymentController.companyCharityHistory
  );

  APP.route("/api/v2/company-payment/history").get(
    companyPakamDataValidation,
    paymentController.companyPaymentHistory
  );
};
