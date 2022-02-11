"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check, param } = require("express-validator");

module.exports = (APP) => {
  APP.route("/api/category/add").post(
    [check("name", "name is required").isString()],
    CONTROLLER.categoryController.addCategory
  );

  APP.route("/api/category/all").get(
    CONTROLLER.categoryController.allCategories
  );
  APP.route("/api/category/:catId").get(
    [param("catId", "catId is required")],
    CONTROLLER.categoryController.getCategory
  );

  APP.route("/api/category/:catId").put(
    [
      param("catId", "catId is required"),
      check("name", "name must be string").optional().isString(),
    ],
    CONTROLLER.categoryController.updateCategory
  );

  APP.route("/api/category/:catId").delete(
    [param("catId", "catId is required")],
    CONTROLLER.categoryController.deleteCategory
  );
};
