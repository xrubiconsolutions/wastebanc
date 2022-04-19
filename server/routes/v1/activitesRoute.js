"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const userValidator = require("../../validators/userValidator.js");
const { checkRequestErrs } = require("../../util/commonFunction");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/activity/add").post(
    userValidator.storeactivites,
    checkRequestErrs,
    controller.activitesController.add
  );

  APP.route("/api/activity/get").get(
    recyclerValidation,
    controller.activitesController.get
  );
};
