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
        .get(auth.adminPakamValidation, CONTROLLER.reportController.allReport);

    APP.route('/api/report/analytics')
        .get(CONTROLLER.reportController.allReportAnalytics);
    
    APP.route('/api/bulk/sms').post(
        auth.adminPakamValidation,
        CONTROLLER.versionController.sendBulkSms
    )
        
}