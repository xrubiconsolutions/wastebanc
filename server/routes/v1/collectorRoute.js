'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/collector/register')
        .post(CONTROLLER.collectorController.registerCollector);
        
    APP.route('/api/collector/login')
        .post(CONTROLLER.collectorController.loginCollector);

    APP.route('/api/collector/verify')
        .post(CONTROLLER.collectorController.verifyPhone);

    APP.route('/api/collector/resendVerification')
        .post(CONTROLLER.collectorController.resendVerification);

    APP.route('/api/collector/update')
        .post(CONTROLLER.collectorController.updateCollector);

    APP.route('/api/collector/accepted')
        .get(CONTROLLER.collectorController.checkAccepted);
    
    APP.route('/api/collector/total/accepted')
        .get(CONTROLLER.collectorController.checkTotalAccepted);

    APP.route('/api/collector/completed')
        .get(CONTROLLER.collectorController.checkCompleted);
    
    APP.route('/api/collector/total/completed')
        .get(CONTROLLER.collectorController.checkTotalCompleted);
    
    APP.route('/api/collector/missed')
        .get(CONTROLLER.collectorController.checkMissed);
    
    APP.route('/api/collector/total/missed')
        .get(CONTROLLER.collectorController.checkTotalMissed);

    APP.route('/api/collector/transactions')
        .get(CONTROLLER.collectorController.getTransactions);

    APP.route('/api/collector/analytics')
        .get(CONTROLLER.collectorController.collectorAnalysis);
    
    APP.route('/api/collector/location')
        .post(CONTROLLER.collectorController.updatePosition);


    APP.route('/api/collector/update/phone/specifications')
        .post(CONTROLLER.collectorController.updatePhoneSpecifications);


    APP.route("/api/delete/recycler").post(CONTROLLER.collectorController.deleteRecycler);


    APP.route("/api/recycler/analytics/month").get(CONTROLLER.collectorController.monthFiltering);


    APP.route('/api/collector/activity')
    .get(CONTROLLER.collectorController.collectorAnalytics);






    // APP.route('/api/collector/accepted')
    //     .get(CONTROLLER.collectorController.checkAccepted);
}