'use strict';

let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing Schedule Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP)=>{

    APP.route('/api/schedule')
        .post(CONTROLLER.scheduleController.schedule);

    APP.route('/api/getSchedule')
        .get(CONTROLLER.scheduleController.getSchedule);

    APP.route('/api/getSchedules')
        .get(CONTROLLER.scheduleController.getSchedules);

    APP.route('/api/collectorSchedule')
        .get(CONTROLLER.scheduleController.collectorSchedule);
    
    APP.route('/api/updateSchedule')
        .post(CONTROLLER.scheduleController.updateSchedule);
    
    APP.route('/api/acceptCollection')
        .post(CONTROLLER.scheduleController.acceptCollection);

    APP.route('/api/allMissed')
        .get(CONTROLLER.scheduleController.allMissedSchedules);

    APP.route('/api/allPending')
        .get(CONTROLLER.scheduleController.allPendingSchedules);

    APP.route('/api/allCompleted')
        .get(CONTROLLER.scheduleController.allCompletedSchedules);
    
    APP.route('/api/rewardUser')
        .post(CONTROLLER.scheduleController.rewardSystem);

    APP.route('/api/agentTransactions')
        .get(CONTROLLER.scheduleController.allAgentTransaction);
    
    APP.route('/api/allWeight')
        .get(CONTROLLER.scheduleController.allWeight);


    APP.route('/api/getBalance')
        .get(CONTROLLER.scheduleController.getBalance);

    APP.route('/api/allCoins')
        .get(CONTROLLER.scheduleController.allCoins);


    
        
    APP.route('/getSchedule')
        .get((req, res)=>{
            res.jsonp('cool')
        })    

};