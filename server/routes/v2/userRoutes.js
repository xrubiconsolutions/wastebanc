const UserService = require("../../controllerv2/userController.js");
const adminAuthorization = require("../../middleware/adminAuthorization.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    adminAuthorization(),
    commonValidator.filter,
    checkRequestErrs,
    UserService.getClients
  );

  APP.route("/api/v2/clients/search").get(
    adminAuthorization(),
    commonValidator.search,
    checkRequestErrs,
    UserService.searchClients
  );
};
