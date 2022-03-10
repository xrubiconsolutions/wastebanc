const UserService = require("../../controllerv2/userController.js");

const { checkRequestErrs } = require("../../util/commonFunction.js");
const commonValidator = require("../../validators/commonValidator.js");
const { adminPakamValidation } = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/clients").get(
    adminPakamValidation,
    // commonValidator.filter,
    // checkRequestErrs,
    UserService.getClients
  );

  APP.route("/api/v2/clients/search").get(
    adminPakamValidation,
    // commonValidator.search,
    // checkRequestErrs,
    UserService.searchClients
  );
};
