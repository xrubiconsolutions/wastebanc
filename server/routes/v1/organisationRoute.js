
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
    
    APP.route('/api/login/organisation')
        .post(CONTROLLER.organisationController.loginOrganisation);
        
    APP.route('/api/reset/password/organisation')
        .post(CONTROLLER.organisationController.changedlogedInPassword);
        

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
        .get(CONTROLLER.organisationController.historyTransaction);

     APP.route('/api/all/recyclers')
        .get(CONTROLLER.organisationController.allRecyclers);

    APP.route('/api/all/users')
        .get(CONTROLLER.organisationController.allUsers);

    APP.route('/api/recycler/payment/receipt')
        .post(CONTROLLER.organisationController.payRecyclers);
      
    APP.route('/api/recycler/payment/log')
        .post(CONTROLLER.organisationController.paymentLog);

    APP.route('/api/company/log/history')
        .get(CONTROLLER.organisationController.logHistory);

    APP.route('/api/recycler/payment/history')
        .get(CONTROLLER.organisationController.getAllTransactions);
    
    APP.route('/api/organisation/month/chart')
        .get(CONTROLLER.organisationController.monthChartData);
    
    APP.route('/api/organisation/third/chart')
        .get(CONTROLLER.organisationController.thirdChartData);
       
    APP.route('/api/organisation/forth/chart')
        .get(CONTROLLER.organisationController.forthChartData);
       
    APP.route('/api/organisation/week/chart')
        .get(CONTROLLER.organisationController.weekChartData);
    
    APP.route('/api/organisation/raffle')
        .get(CONTROLLER.organisationController.raffleTicket);
    
    APP.route('/api/organisation/waste/history')
        .get(CONTROLLER.organisationController.wasteHistory);
    
    APP.route('/api/lawma/transaction/history')
        .get(CONTROLLER.organisationController.lawmaTransaction);
    
    APP.route('/api/all/transaction/history')
        .get(CONTROLLER.organisationController.adminTransaction);
       
                   
};