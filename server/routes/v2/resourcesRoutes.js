const ResourcesCtrl = require("../../controllerv2/resourcesController");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const {
  addResource,
  resourceId,
} = require("../../validators/resourcesValidator");
const {
  adminPakamValidation,
  recyclerValidation,
  companyPakamDataValidation,
  userValidation,
} = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/resource").post(
    adminPakamValidation,
    addResource,
    checkRequestErrs,
    ResourcesCtrl.addResource
  );

  APP.route("/api/resource/:resourceId").put(
    adminPakamValidation,
    resourceId,
    checkRequestErrs,
    ResourcesCtrl.updateResource
  );

  APP.route("/api/resources").get(ResourcesCtrl.listResources);
  APP.route("/api/resource/:resourceId").get(ResourcesCtrl.findResource);
  APP.route("/api/resource/:resourceId").delete(ResourcesCtrl.removeResource);
};
