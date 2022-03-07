"use strict";

const controller = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/location/create").post(
    auth.adminPakamValidation,
    [
      body("country")
        .notEmpty()
        .withMessage("country is required")
        .isString()
        .withMessage("country should be string"),
      body("states")
        .notEmpty()
        .withMessage("states is required")
        .isArray()
        .withMessage("states should be array"),
    ],
    controller.locationController.create
  );

  APP.route("/api/locations").get(controller.locationController.locations);
  APP.route("/api/location/:locationId").get(
    controller.locationController.getLocation
  );

  APP.route("/api/location/:locationId").put(
    auth.adminPakamValidation,
    [
      body("countries").optional().isArray().withMessage("countries"),
      body("states").optional().isArray().withMessage("states should be array"),
      param("locationId").notEmpty().withMessage("locationId is required"),
    ],
    controller.locationController.update
  );

  APP.route("/api/location/:locationId").delete(
    auth.adminPakamValidation,
    [param("locationId").notEmpty().withMessage("locationId is required")],
    controller.locationController.remove
  );
};
