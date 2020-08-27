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

    APP.route('/api/collector/update')
        .post(CONTROLLER.collectorController.updateCollector);

    APP.route('/api/collector/accepted')
        .get(CONTROLLER.collectorController.checkAccepted);

    APP.route('/api/collector/completed')
        .get(CONTROLLER.collectorController.checkCompleted);
    
    APP.route('/api/collector/missed')
        .get(CONTROLLER.collectorController.checkMissed);

    // APP.route('/api/collector/accepted')
    //     .get(CONTROLLER.collectorController.checkAccepted);
}