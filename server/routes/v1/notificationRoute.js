"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");

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
};
