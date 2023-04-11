const UserService = require("../../controllerv2/userController.js");

const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const userValidator = require("../../validators/userValidator");
const { adminPakamValidation, userValidation } = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    adminPakamValidation,
    // commonValidator.filter,
    // checkRequestErrs,
    UserService.getClients
  );

  APP.route("/api/v2/clients/search").get(
    adminPakamValidation,
    // commonValidator.search,
    // checkRequestErrs,
    UserService.searchClients
  );

  APP.route("/api/register").post(
    userValidator.register,
    checkRequestErrs,
    UserService.register
  );

  APP.route("/api/v2/reportlogs").get(
    adminPakamValidation,
    UserService.getAllUserReportLogs
  );

  APP.route("/api/v2/user/reportlogs").get(
    userValidation,
    UserService.getUserReportLogs
  );

  APP.route("/api/verify").post(UserService.verifyOTP);

  APP.route("/api/login").post(UserService.login);
  APP.route("/api/v2/password-reset").put(
    userValidator.passwordReset,
    checkRequestErrs,
    UserService.resetPassword
  );

  // user accept terms and condition

  APP.route("/api/user/accept/termscondition").post(
    userValidator.termsCondition,
    checkRequestErrs,
    UserService.acceptTermsCondition
  );

  APP.route("/api/user/remove").post(userValidation, UserService.deleteUser);

  APP.route("/api/user/details/:userId").get(
    adminPakamValidation,
    userValidator.userDetails,
    checkRequestErrs,
    UserService.userDetails
  );

  APP.route("/api/user/payout_requests/:userId").get(
    adminPakamValidation,
    userValidator.userDetails,
    checkRequestErrs,
    UserService.userBankPayoutRequests
  );

  APP.route("/api/user/insurance").get(
    adminPakamValidation,
    UserService.insuranceUser
  );
};
