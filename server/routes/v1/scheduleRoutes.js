'use strict';

let CONTROLLER      =   require("../../controller");

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

    
    APP.route('/getSchedule')
        .get((req, res)=>{
            res.jsonp('cool')
        })    

};