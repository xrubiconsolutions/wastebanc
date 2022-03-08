"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/roles/create").post(
    auth.adminPakamValidation,
    [
      body("title")
        .notEmpty()
        .withMessage("title is required")
        .isString()
        .withMessage("title must be string"),
      body("group")
        .optional({ default: "admin" })
        .isString()
        .withMessage("group must be string"),
      body("claims").notEmpty().isArray().withMessage("cliams should be array"),
    ],
    controller.roleController.create
  );

  APP.route("/api/roles").get(controller.roleController.roles);
  APP.route("/api/roles/:roleId").get(
    [
      param("roleId")
        .notEmpty()
        .withMessage("roleId is required")
        .isString()
        .withMessage("roleId should be string"),
    ],
    controller.roleController.getRole
  );
  APP.route("/api/roles/:roleId").put(
    [
      param("roleId")
        .notEmpty()
        .withMessage("roleId is required")
        .isString()
        .withMessage("roleId should be string"),
    ],
    auth.adminPakamValidation,
    controller.roleController.update
  );

  APP.route("/api/roles/:roleId").delete(
    [
      param("roleId")
        .notEmpty()
        .withMessage("roleId is required")
        .isString()
        .withMessage("roleId should be string"),
    ],
    auth.adminPakamValidation,
    controller.roleController.remove
  );
};
