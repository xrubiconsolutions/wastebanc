const paymentController = require("../../controllerv2/paymentController");
const { adminPakamValidation } = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/payment/history").get(
    adminPakamValidation,
    paymentController.paymentHistory
  );

  APP.route("/api/v2/charity/history").get(
    adminPakamValidation,
    paymentController.charityHistory
  );
};
