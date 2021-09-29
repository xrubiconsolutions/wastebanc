"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {
  APP.route("/api/filter/users").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyUsers
  );

  APP.route("/api/filter/paginated/users").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyFilterPaginated
  );

  APP.route("/api/filter/month/users").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyNewUsers
  );

  APP.route("/api/filter/paginated/schedules").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyFilterSchedulesPaginated
  );

  APP.route("/api/filter/recyclers").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyRecyclers
  );

  APP.route("/api/filter/schedules").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlySchedules
  );

  APP.route("/api/filter/adverts").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyAdverts
  );

  APP.route("/api/filter/reports").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyReports
  );

  APP.route("/api/filter/companies").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyCompanies
  );

  APP.route("/api/filter/wastes").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.monthlyWasteCollected
  );

  APP.route("/api/adverts/request").get(
    auth.userCollectorData,
    CONTROLLER.analyticsFilterController.advertsRequest
  );
  APP.route("/api/create/version").post(
    auth.adminValidation,
    CONTROLLER.versionController.createAppVersion
  );
  APP.route("/api/update/version").post(
    auth.adminValidation,
    CONTROLLER.versionController.updateVersion
  );
  APP.route("/api/get/version").get(CONTROLLER.versionController.getAppVersion);
  APP.route("/api/get/all/versions").get(
    auth.adminValidation,
    CONTROLLER.versionController.adminAppVersions
  );
};
