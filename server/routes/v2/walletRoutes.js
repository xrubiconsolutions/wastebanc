const walletController = require("../../controllerv2/walletMangController.js");
const {
  adminPakamValidation,
  recyclerValidation,
  userValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/user/request/otp").get(
    userValidation,
    walletController.OTPRequest
  );
  APP.route("/api/collector/request/otp").get(
    recyclerValidation,
    walletController.OTPRequest
  );
};
