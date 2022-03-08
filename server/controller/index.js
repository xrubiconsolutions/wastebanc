"use strict";

/**************************************************
 ************** Controller Manager ****************
 **************************************************/

module.exports = {
  userController: require("./userController"),
  scheduleController: require("./scheduleController"),
  organisationController: require("./organisationController"),
  webPushController: require("./webPushController"),
  collectorController: require("./collectorController"),
  reportController: require("./reportController"),
  realtimeController: require("./realtimeController"),
  payController: require("./payController"),
  notificationController: require("./notificationController"),
  analyticsFilterController: require("./analyticsFilterController"),
  versionController: require("./versionController"),
  scheduleDropController: require("./scheduleDropController"),
  categoryController: require("./categoryController"),
  locationController: require("./locationController"),
  claimController: require("./claimsController"),
  roleController: require("./roleController"),
  userAgenciesController: require("./userAgenciesController"),
};
