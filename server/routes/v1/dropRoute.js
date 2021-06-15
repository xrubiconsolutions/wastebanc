'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/submit/drop/request')
        .post(
            CONTROLLER.scheduleDropController.schedule);

    APP.route('/api/pending/drop/request')
            .get(
                auth.adminPakamValidation,
                CONTROLLER.scheduleDropController.getPendingSchedule);

    APP.route('/api/completed/drop/request')
                .get(
                    auth.adminPakamValidation,
                    CONTROLLER.scheduleDropController.getCompletedSchedule);

    APP.route('/api/complete/recycler/payment/drop')
                    .post(
                        auth.recyclerValidation,
                        CONTROLLER.scheduleDropController.rewardDropSystem);

    APP.route('/api/get/recycler/drop')
                        .get(
                            auth.recyclerValidation,
                            CONTROLLER.scheduleDropController.dropRequestRecycler);
}