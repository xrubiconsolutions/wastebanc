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
        .post(CONTROLLER.payController.saveReceipt);
}