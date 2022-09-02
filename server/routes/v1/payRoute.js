"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {
  APP.route("/api/all/banks").get(CONTROLLER.payController.getBanks);

  // account number resolver
  APP.route("/api/resolve/account").get(
    auth.userValidation,
    CONTROLLER.payController.resolveAccount
  );

  APP.route("/api/admin/resolve/account").get(
    auth.adminPakamValidation,
    CONTROLLER.payController.resolveAccount
  );

  APP.route("/api/payment/receipt").post(
    auth.userValidation,
    CONTROLLER.payController.saveR
  );

  APP.route("/api/payment/user/current").get(
    CONTROLLER.payController.afterPayment
  );

  APP.route("/api/requested/payout").get(
    auth.companyValidation,
    CONTROLLER.payController.requestedPayment
  );
  APP.route("/api/payout/history").get(
    auth.adminPakamValidation,
    CONTROLLER.payController.allPayoutHistory
  );
  APP.route("/api/update/payment").post(
    auth.companyValidation,
    CONTROLLER.payController.paymentUpdate
  );
  APP.route("/api/charity/payment").post(
    auth.userValidation,
    CONTROLLER.payController.charityP
  );
};
