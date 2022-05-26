"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");
const categoryValidator = require("../../validators/categoryValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");

module.exports = (APP) => {
  APP.route("/api/category/add").post(
    auth.adminPakamValidation,
    categoryValidator.createCategory,
    checkRequestErrs,
    CONTROLLER.categoryController.addCategory
  );

  APP.route("/api/category/all").get(
    CONTROLLER.categoryController.allCategories
  );
  APP.route("/api/category/:catId").get(
    categoryValidator.categoryId,
    checkRequestErrs,
    CONTROLLER.categoryController.getCategory
  );

  APP.route("/api/category/:catId").put(
    categoryValidator.updateCategory,
    checkRequestErrs,
    CONTROLLER.categoryController.updateCategory
  );

  APP.route("/api/category/:catId").delete(
    auth.adminPakamValidation,
    categoryValidator.categoryId,
    checkRequestErrs,
    CONTROLLER.categoryController.deleteCategory
  );
};
