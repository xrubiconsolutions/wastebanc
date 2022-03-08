const UserService = require("../../controllerv2/userController.js");
const { userValidation } = require("../../util/auth");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    commonValidator.filter,
    checkRequestErrs,
    UserService.getClients
  );

  APP.route("/api/v2/clients/search").get(
    commonValidator.search,
    checkRequestErrs,
    UserService.searchClients
  );
};
