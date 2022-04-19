"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const commonValidator = require("../../validators/commonValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");
/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {
  APP.route("/api/notify/organisations").get(
    CONTROLLER.notificationController.notifyOrganisations
  );

  APP.route("/api/notify/user").get(
    auth.userValidation,
    CONTROLLER.notificationController.householdNotification
  );

  APP.route("/api/push/notification").get(
    auth.userValidation,
    CONTROLLER.notificationController.pushNotification
  );

  APP.route("/api/notification/remove").delete(
    auth.userValidation,
    //auth.recyclerValidation,
    commonValidator.removenotification,
    checkRequestErrs,
    CONTROLLER.notificationController.removeNotification
  );

  APP.route("/api/recycler/notification/remove").delete(
    auth.recyclerValidation,
    commonValidator.removenotification,
    checkRequestErrs,
    CONTROLLER.notificationController.removeNotification
  );
};
