
'use strict';
let CONTROLLER      =   require("../../controller");
let auth            =   require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {

    APP.route('/api/register')
        .post(CONTROLLER.userController.registerUser);
        
    APP.route('/api/fileUpload')
        .post(CONTROLLER.userController.upload);

    APP.route('/api/login')
        .post(CONTROLLER.userController.loginUser);

    APP.route('/api/verify')
        .post(CONTROLLER.userController.verifyPhone);   
    
    APP.route('/api/resendVerification')
        .post(CONTROLLER.userController.resendVerification);   

    APP.route('/api/forgotPassword')
        .post(CONTROLLER.userController.forgotPassword);

    APP.route('/api/changePassword')
        .post(CONTROLLER.userController.changePassword);
    APP.route('/getUser')
        .get((req, res)=>{
            res.jsonp('cool')
        })    
};