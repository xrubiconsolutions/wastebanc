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
  realtimeController : require("./realtimeController"),
};
