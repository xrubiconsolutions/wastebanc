'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/filter/users')
        .get(CONTROLLER.analyticsFilterController.monthlyUsers);

    APP.route('/api/filter/recyclers')
        .get(CONTROLLER.analyticsFilterController.monthlyRecyclers);
    
    APP.route('/api/filter/schedules')
        .get(CONTROLLER.analyticsFilterController.monthlySchedules);

    APP.route('/api/filter/adverts')
        .get(CONTROLLER.analyticsFilterController.monthlyAdverts);
    
    APP.route('/api/filter/reports')
        .get(CONTROLLER.analyticsFilterController.monthlyReports);
  
    APP.route('/api/filter/companies')
        .get(CONTROLLER.analyticsFilterController.monthlyCompanies);


}