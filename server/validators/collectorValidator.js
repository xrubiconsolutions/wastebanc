const { body, param } = require("express-validator");
const collectorModel = require("../models/collectorModel");

module.exports = {
  verifyCollector: [
    body("collectorId")
      .exists()
      .withMessage("provide collector id")
      .isMongoId()
      .withMessage("invalid id")
      .custom(async (val) => {
        const collector = await collectorModel.findById(val);
        if (!collector)
          throw new Error("collector/waste picker with id not found");
        return true;
      }),
  ],

  createCollector: [
    body("fullname").notEmpty().withMessage("fullname is required"),
    body("email").optional().isEmail().withMessage("Enter is valid email"),
    body("phone").notEmpty().withMessage("phone is required"),
    body("password").notEmpty().withMessage("password is required"),
    body("gender").notEmpty().withMessage("gender is required"),
    body("state").notEmpty().withMessage("state is required"),
    body("country").notEmpty().withMessage("country is required"),
    body("organisation")
      .optional()
      .isString()
      .withMessage("organisation should be string"),
  ],

  verifyOTP: [
    body("phone").notEmpty().withMessage("phone is required"),
    body("token").notEmpty().withMessage("token is required"),
    body("pin_id").notEmpty().withMessage("pin_id is required"),
  ],

  updateCollector: [
    body("fullname")
      .optional()
      .isString()
      .withMessage("fullname should string"),
    body("email").optional().isEmail().withMessage("Enter is valid email"),
    body("gender").optional().isString("gender should be string"),
    body("address").optional().isString("address should be string"),
    body("aggregatorId").optional().isString("aggregatorId should be string"),
    body("organisation").optional().isString("organisation should be string"),
    body("localGovernment")
      .optional()
      .isString("localGovernment should be string"),
    body("profile_picture")
      .optional()
      .isString("profile_picture should be string"),
  ],

  createPicker: [
    body("fullname").notEmpty().withMessage("fullname is required"),
    body("email").optional().isEmail().withMessage("Enter is valid email"),
    body("phone").notEmpty().withMessage("phone is required"),
    //body("password").notEmpty().withMessage("password is required"),
    body("gender").notEmpty().withMessage("gender is required"),
    body("state").notEmpty().withMessage("state is required"),
    body("country").notEmpty().withMessage("country is required"),
    body("organisation")
      .optional()
      .isString()
      .withMessage("organisation should be string"),
  ],

  assignPicker: [
    body("pickerId").notEmpty().withMessage("pickerId is required"),
    body("organisationId").notEmpty().withMessage("organisationId is required"),
  ],

  unassignPicker: [
    body("pickerId").notEmpty().withMessage("pickerId is required"),
  ],

  changePassword: [
    body("phone")
      .notEmpty()
      .withMessage("phone is required")
      .isString()
      .withMessage("phone should be string"),
    body("oldPassword")
      .notEmpty()
      .withMessage("oldPassword is required")
      .isString()
      .withMessage("oldPassword should be string"),
    body("newPassword")
      .notEmpty()
      .withMessage("newPassword is required")
      .isString()
      .withMessage("newPassword should be string"),
    body("confirmPassword")
      .notEmpty()
      .withMessage("confirmPassword is required")
      .isString()
      .withMessage("confirmPassword should string"),
  ],
  checkCollectorId: [
    param("collectorId").notEmpty().withMessage("collectorId is require"),
  ],
  termsCondition: [
    body("collectorId")
      .notEmpty()
      .withMessage("collectorId is required")
      .isString()
      .withMessage("collectorId should be string"),
  ],
};
