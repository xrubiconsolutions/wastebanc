
'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/create/organisation')
        .post(CONTROLLER.organisationController.createOrganisation);
        
    APP.route('/api/check/organisation')
        .get(CONTROLLER.organisationController.listOrganisation);
};