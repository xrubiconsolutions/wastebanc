
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

    APP.route('/api/approve/organisation')
        .post(CONTROLLER.organisationController.agentApproval);
    
    APP.route('/api/decline/organisation')
        .post(CONTROLLER.organisationController.agentDecline);
    
    APP.route('/api/schedule/organisation')
        .get(CONTROLLER.organisationController.organisationSchedules);

    APP.route('/api/recyclers/organisation')
        .get(CONTROLLER.organisationController.approvedAgents);
      
    APP.route('/api/coins/organisation')
        .get(CONTROLLER.organisationController.coinBank);

    APP.route('/api/weight/organisation')
        .get(CONTROLLER.organisationController.wasteCounter);

    APP.route('/api/transactions/organisation')
        .get(CONTROLLER.organisationController.numberTransaction);

    APP.route('/api/totalSchedules/organisation')
        .get(CONTROLLER.organisationController.totalSchedules);

    APP.route('/api/transaction/history/organisation')
        .get(CONTROLLER.organisationController.totalSchedules);
      
      
      
           
           
};