const CharityOrganisationService = require("../../controllerv2/charityOrganisationController");
const { adminPakamValidation, userValidation } = require("../../util/auth");
const {
  createCharityOrganisation,
} = require("../../validators/charityOrganisationValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");

//
module.exports = (APP) => {
  APP.route("/api/v2/charity-organisations")
    .post(
      adminPakamValidation,
      createCharityOrganisation,
      checkRequestErrs,
      CharityOrganisationService.createCharityOrganisation
    )
    .get(
      adminPakamValidation,
      CharityOrganisationService.getCharityOrganisations
    );

  APP.route("/api/v2/users/charity-organisations").get(
    userValidation,
    CharityOrganisationService.getCharityOrganisations
  );
};
