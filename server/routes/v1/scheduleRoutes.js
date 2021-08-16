"use strict";

let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const express = require("express");

const ProtectedRoutes = express.Router();

// ProtectedRoutes.use((req, res, next) =>{

//     // check header for the token
//     var token = req.headers['access-token'];

//     // decode token
//     if (token) {

//       // verifies secret and checks if the token is expired
//       jwt.verify(token, app.get('Secret'), (err, decoded) =>{
//         if (err) {
//           return res.json({ message: 'invalid token' });
//         } else {
//           // if everything is good, save to request for use in other routes
//           req.decoded = decoded;
//           next();
//         }
//       });

//     } else {

//       // if there is no token

//       res.send({

//           message: 'No token provided.'
//       });

//     }
//   });

/****************************************
 ***** Managing Schedule Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/
module.exports = (APP) => {
  APP.route("/api/schedule").post(CONTROLLER.scheduleController.schedule);

  APP.route("/api/getSchedule").get(CONTROLLER.scheduleController.getSchedule);

  APP.route("/api/getSchedules").get(
    CONTROLLER.scheduleController.getSchedules
  );

  APP.route("/api/collectorSchedule").get(
    CONTROLLER.scheduleController.collectorSchedule
  );

  APP.route("/api/collector/schedule/miss").post(
    CONTROLLER.scheduleController.collectorMissed
  );

  APP.route("/api/geofenced/schedule").get(
    auth.recyclerValidation,
    CONTROLLER.scheduleController.smartRoute
  );

  APP.route("/api/geofenced/schedule/refresh").get(auth.recyclerValidation,
    CONTROLLER.scheduleController.afterCompletion
  );

  APP.route("/api/updateSchedule").post(
    CONTROLLER.scheduleController.updateSchedule
  );

  APP.route("/api/acceptCollection").post(
    CONTROLLER.scheduleController.acceptCollection
  );

  APP.route("/api/all/acceptCollection").post(
    CONTROLLER.scheduleController.acceptAllCollections
  );

  APP.route("/api/allMissed").get(
    CONTROLLER.scheduleController.allMissedSchedules
  );

  APP.route("/api/user/missed").get(
    CONTROLLER.scheduleController.allUserMissedSchedules
  );

  APP.route("/api/allPending").get(
    CONTROLLER.scheduleController.allPendingSchedules
  );

  APP.route("/api/allCompleted").get(
    CONTROLLER.scheduleController.allCompletedSchedules
  );

  APP.route("/api/dashboard/Completed").get(
    CONTROLLER.scheduleController.dashboardCompleted
  );

  APP.route("/api/rewardUser").post(auth.recyclerValidation, CONTROLLER.scheduleController.rewardSystem);

  APP.route("/api/user/completed").post(
    CONTROLLER.scheduleController.userComplete
  );

  APP.route("/api/user/delete").post(CONTROLLER.scheduleController.userDelete);

  APP.route("/api/user/cancel").post(CONTROLLER.scheduleController.userCancel);

  APP.route("/api/agentTransactions").get(
    CONTROLLER.scheduleController.allAgentTransaction
  );

  APP.route("/api/viewAllSchedules").get(
    CONTROLLER.scheduleController.viewAllSchedules
  );

  APP.route("/api/allWeight").get(CONTROLLER.scheduleController.allWeight);

  APP.route("/api/getBalance").get(CONTROLLER.scheduleController.getBalance);

  APP.route("/api/schedule/recycler").get(CONTROLLER.scheduleController.getScheduleCollector);


  APP.route("/api/allCoins").get(CONTROLLER.scheduleController.allCoins);

  APP.route("/api/allAccepted").get(CONTROLLER.scheduleController.allAccepted);

  APP.route("/api/allDeclined").get(CONTROLLER.scheduleController.allDeclined);

  APP.route("/getSchedule").get((req, res) => {
    res.jsonp("cool");
  });

  APP.route('/api/get/notifications').get(
    CONTROLLER.scheduleController.scheduleNotifications
  )
};
