"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const userValidator = require("../../validators/userValidator.js");
const { checkRequestErrs } = require("../../util/commonFunction");

module.exports = (APP) => {
  APP.route("/api/activity/add").post(
    userValidator.storeactivites,
    checkRequestErrs,
    controller.activitesController.add
  );

  APP.route("/api/activity/get/:userId").get(
    userValidator.getActivites,
    checkRequestErrs,
    controller.activitesController.get
  );
};
