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
        .post(CONTROLLER.payController.resolveAccount);
}