const lcdAreasController = require("../../controllerv2/lcdAreasController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");

const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/v2/area/create").post(
    adminPakamValidation,
    [
      body("coverageArea").notEmpty().withMessage("coverageArea is required"),
      body("lga").notEmpty().withMessage("lga is required"),
      body("country").optional({ default: "" }),
      body("state").optional({ default: "" }),
    ],
    lcdAreasController.create
  );

  APP.route("/api/v2/area/:areaId").get(
    adminPakamValidation,
    [param("areaId").notEmpty().withMessage("areaId is required")],
    lcdAreasController.find
  );

  APP.route("/api/v2/area/:areaId").put(
    adminPakamValidation,
    [param("areaId").notEmpty().withMessage("areaId is required")],
    lcdAreasController.update
  );

  APP.route("/api/v2/area/:areaId").delete(
    adminPakamValidation,
    [param("areaId").notEmpty().withMessage("areaId is required")],
    lcdAreasController.remove
  );

  APP.route("/api/v2/areas").get(
    adminPakamValidation,
    lcdAreasController.getLcd
  );
};
