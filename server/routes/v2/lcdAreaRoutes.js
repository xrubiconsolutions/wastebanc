const lcdAreasController = require("../../controllerv2/lcdAreasController");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
} = require("../../util/auth");

const { body, query, check, param } = require("express-validator");

const { checkRequestErrs } = require("../../util/commonFunction");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/area/create").post(
    adminPakamValidation,
    commonValidator.createArea,
    checkRequestErrs,
    lcdAreasController.create
  );

  APP.route("/api/v2/area/:areaId").get(
    adminPakamValidation,
    commonValidator.areaId,
    checkRequestErrs,
    lcdAreasController.find
  );

  APP.route("/api/v2/area/:areaId").put(
    adminPakamValidation,
    commonValidator.areaId,
    checkRequestErrs,
    lcdAreasController.update
  );

  APP.route("/api/v2/area/:areaId").delete(
    adminPakamValidation,
    commonValidator.areaId,
    checkRequestErrs,
    lcdAreasController.remove
  );

  APP.route("/api/v2/areas").get(
    adminPakamValidation,
    lcdAreasController.getLcd
  );
};
