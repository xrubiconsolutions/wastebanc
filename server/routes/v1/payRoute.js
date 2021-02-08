'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/all/banks')
        .get(CONTROLLER.payController.getBanks);
        
    APP.route('/api/resolve/account')
        .get(CONTROLLER.payController.resolveAccount);

    APP.route('/api/payment/receipt')
        .post(auth.userValidation,CONTROLLER.payController.saveReceipt);

    APP.route('/api/payment/user/current')
        .get(CONTROLLER.payController.afterPayment);

    APP.route('/api/requested/payout').get(
        auth.companyValidation,
        CONTROLLER.payController.requestedPayment
    )
    APP.route('/api/payout/history').get(
        auth.companyValidation,
        CONTROLLER.payController.allPayoutHistory
    )
}