const { body } = require("express-validator");
const organisationModel = require("../models/organisationModel");

module.exports = {
  createDropOffLocation: [
    body("organisation")
      .exists()
      .withMessage("Provide organisation name")
      .isString("Organisation name must be a string"),
    body("organisationId")
      .exists()
      .withMessage("Provide organisation id")
      .isMongoId("Organisation name must be a valid id")
      .custom(async (id) => {
        const organisation = await organisationModel.findById(id);
        if (!organisation) throw new Error("No organisation with supplied id");
        return true;
      }),
    body("phone")
      .exists()
      .withMessage("Provide phone number")
      .isMobilePhone()
      .withMessage("Phone No. is invalid "),
    body("location.address")
      .exists()
      .withMessage("Provide location address")
      .isString()
      .withMessage("Address must be a string"),
    body("location.lat").exists().withMessage("Provide location lat"),
    body("location.long").exists().withMessage("Provide location long"),
  ],
  deleteDropOff: [
    body("dropOffId")
      .exists()
      .withMessage("provide drop-off id")
      .isMongoId()
      .withMessage("id is invalid"),
  ],
};
