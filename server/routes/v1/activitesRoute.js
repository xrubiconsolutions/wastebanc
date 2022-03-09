"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/activity/add").post(
    [
      body("userId")
        .notEmpty()
        .withMessage("userId is required")
        .isString()
        .withMessage("userId should be string"),
      body("message")
        .notEmpty()
        .withMessage("message is required")
        .isString()
        .withMessage("message should be string"),
      body("type")
        .optional({ default: "collector" })
        .isString()
        .withMessage("type should be string"),
      body("activity_type")
        .notEmpty()
        .withMessage("activity_type is required")
        .isString()
        .withMessage("activity_type should be string"),
    ],
    controller.activitesController.add
  );

  APP.route("/api/activity/get/:userId").get(
    [
      param("userId")
        .notEmpty()
        .withMessage("userId is required")
        .isString()
        .withMessage("userId should be string"),
      query("type")
        .notEmpty()
        .withMessage("type is required")
        .isString()
        .withMessage("type should be string"),
    ],
    controller.activitesController.get
  );
};
