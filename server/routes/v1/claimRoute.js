"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/claim/create").post(
    auth.adminPakamValidation,
    [
      body("title")
        .notEmpty()
        .withMessage("title is required")
        .isString()
        .withMessage("title should be string"),
      body("path")
        .notEmpty()
        .withMessage("path is required")
        .isString()
        .withMessage("path should be string"),
      body("icon")
        .optional({ default: "" })
        .isString()
        .withMessage("icon should be string"),
      body("ancestor")
        .optional({ default: [] })
        .isArray()
        .withMessage("ancestors is an array of string"),
      body("children")
        .optional({ default: [] })
        .isArray()
        .withMessage("children is an array of string"),
      body("iconClosed")
        .optional({ default: "" })
        .isString()
        .withMessage("iconClosed should be string"),
      body("iconOpened")
        .optional({ default: "" })
        .isString()
        .withMessage("iconOpened should be string"),
      body("show")
        .optional({ default: true })
        .isBoolean()
        .withMessage("icon should be either true or false"),
      body("position")
        .notEmpty()
        .withMessage("position is required")
        .isInt()
        .withMessage("position is integer"),
      body("dashboard")
        .notEmpty()
        .withMessage("dashboard is required")
        .isArray()
        .withMessage("dashboard should be an array of string"),
      body("level")
        .optional({ default: "0" })
        .isString()
        .withMessage("level should be string"),
    ],
    controller.claimController.create
  );

  APP.route("/api/claims").get(
    // [
    //   query("filter")
    //     .notEmpty()
    //     .withMessage("filter is required")
    //     .isString()
    //     .withMessage("filter should either string of admin or recycler"),
    // ],
    controller.claimController.claims
  );
  APP.route("/api/claim/:claimId").get(controller.claimController.getClaim);
  APP.route("/api/claim/:claimId").put(
    auth.adminPakamValidation,
    controller.claimController.update
  );
  APP.route("/api/claim/:claminId").delete(
    auth.adminPakamValidation,
    controller.claimController.remove
  );
};
