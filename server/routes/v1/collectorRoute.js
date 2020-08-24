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
        
    APP.route('/api/fileUpload')
        .post(CONTROLLER.userController.upload);
}