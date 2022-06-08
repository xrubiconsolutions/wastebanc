const walletController = require("../../controllerv2/walletMangController.js");
const {
  adminPakamValidation,
  recyclerValidation,
  userValidation,
} = require("../../util/auth");
const {
  accountLookup,
  accountNo,
  openAccount,
  nipTransfer,
} = require("../../validators/userValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");
module.exports = (APP) => {
  APP.route("/api/user/request/otp").get(
    userValidation,
    checkRequestErrs,
    walletController.OTPRequest
  );
  APP.route("/api/collector/request/otp").get(
    recyclerValidation,
    walletController.OTPRequest
  );

  APP.route("/api/bank/list").get(walletController.bankList);

  APP.route("/api/user/sterling/nipaccount/lookup").post(
    userValidation,
    accountLookup,
    checkRequestErrs,
    walletController.verifyAccount
  );

  APP.route("/api/collector/account/lookup").post(
    recyclerValidation,
    accountLookup,
    checkRequestErrs,
    walletController.verifyAccount
  );

  APP.route("/api/user/verify/sterling/customer/:accountNo").get(
    accountNo,
    checkRequestErrs,
    walletController.verifyCustomer
  );

  APP.route("/api/collector/sterling/openAccount").post(
    recyclerValidation,
    openAccount,
    checkRequestErrs,
    walletController.openingAccount
  );

  APP.route("/api/user/sterling/openAccount").post(
    userValidation,
    openAccount,
    checkRequestErrs,
    walletController.openingAccount
  );

  APP.route("/api/user/sterling/nip/transfer").post(
    userValidation,
    nipTransfer,
    checkRequestErrs,
    walletController.nipTransfer
  );

  APP.route("/api/encrypt").post(walletController.encrypt);
  APP.route("/api/decrypt").post(walletController.decrypt);
};
