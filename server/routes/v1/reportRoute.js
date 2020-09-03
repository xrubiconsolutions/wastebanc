'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/report')
        .post(CONTROLLER.reportController.report);

    APP.route('/api/end/report')
        .post(CONTROLLER.reportController.endReport);

    APP.route('/api/user/report')
        .post(CONTROLLER.reportController.getReport);

    APP.route('/api/all/report')
        .get(CONTROLLER.reportController.allReport);
        
}