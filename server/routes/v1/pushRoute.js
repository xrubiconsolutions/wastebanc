'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");



module.exports = (APP)=>{

    APP.route('/api/subscribe')
        .post(CONTROLLER.webPushController.subscribe);
}