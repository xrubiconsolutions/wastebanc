const { body, param, query } = require("express-validator");
const { ROLES_ENUM } = require("../util/constants");

module.exports = {
  login: [
    body("email", "email is required").isString(),
    body("password", "password is required").isString(),
  ],

  userAgencies: [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .isString()
      .withMessage("name should be string"),
    body("email").trim().notEmpty().withMessage("email is required"),
    body("countries")
      .notEmpty()
      .withMessage("countries is required")
      .isArray()
      .withMessage("countries should be array"),
    body("states")
      .notEmpty()
      .withMessage("states is required")
      .isArray()
      .withMessage("states should be array"),
    body("role")
      .notEmpty()
      .withMessage("role is required")
      .isString()
      .withMessage("role should be string"),
    body("phone")
      .notEmpty()
      .withMessage("phone is required")
      .isNumeric()
      .withMessage("phone is number"),
  ],

  findAgencies: [
    param("agencyId").notEmpty().withMessage("agencyId is required"),
  ],

  updateAgencies: [
    param("agencyId").notEmpty().withMessage("agencyId is required"),
  ],

  storeactivites: [
    body("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId should be string"),
    body("message")
      .notEmpty()
      .withMessage("message is required")
      .isString()
      .withMessage("message should be string"),
    body("type")
      .optional({ default: "collector" })
      .isString()
      .withMessage("type should be string"),
    body("activity_type")
      .notEmpty()
      .withMessage("activity_type is required")
      .isString()
      .withMessage("activity_type should be string"),
  ],

  getActivites: [
    param("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId should be string"),
    query("type")
      .notEmpty()
      .withMessage("type is required")
      .isString()
      .withMessage("type should be string"),
  ],

  locationScope: [
    query("scope")
      .notEmpty()
      .withMessage("location scope is required in query params")
      .isString()
      .withMessage("location scope must be a string"),
  ],

  register: [
    body("fullname")
      .notEmpty()
      .withMessage("fullname is required")
      .isString()
      .withMessage("fullname should be string"),
    body("phone")
      .notEmpty()
      .withMessage("phone is required")
      .isNumeric()
      .withMessage("phone should be numeric string"),
    body("email")
      .trim()
      .optional()
      .isEmail()
      .withMessage("Enter a valid email"),
    body("gender")
      .notEmpty()
      .withMessage("gender is required")
      .isIn(["male", "female", "prefer not to say"]),
    body("country").notEmpty().withMessage("country is required"),
    body("state").notEmpty().withMessage("state is required"),
    body("lga").notEmpty().withMessage("lga is required"),
    body("uType").notEmpty().withMessage("uType is required"),
    body("organisation").optional(),
    //body("onesignal_id").notEmpty().withMessage("onesignal_id is required"),
  ],

  passwordReset: [
    body("email")
      .trim()
      .custom((email, { req }) => {
        if (!(email || req.body.phone))
          throw new Error("Email or phone number is required");
        return true;
      }),
    body("password").custom((password, { req }) => {
      if (!(password || req.body.confirmPassword))
        throw new Error("password and confirmPassword are both required");
      if (password !== req.body.confirmPassword)
        throw new Error("password and confirmPassword do not match");
      return true;
    }),
    body("role")
      .trim()
      .notEmpty()
      .withMessage("Role is required")
      .isString()
      .withMessage("type must be a string")
      .isIn(ROLES_ENUM)
      .withMessage(`Role must be among: ${ROLES_ENUM}`),
  ],
  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("currentPassword is required")
      .isString()
      .withMessage("current password must be a string")
      .isLength({
        min: 6,
      })
      .withMessage("password must be greater than 5 characters"),
    body("newPassword")
      .notEmpty()
      .withMessage("newPassword is required")
      .isString()
      .withMessage("password must be a string")
      .isLength({
        min: 6,
      })
      .withMessage("password must be greater than 5 characters"),
  ],

  accountLookup: [
    body("accountNumber")
      .notEmpty()
      .withMessage("accountNumber is required")
      .isString()
      .withMessage("accountNumber should be string"),
    body("BankCode")
      .notEmpty()
      .withMessage("BankCode is required")
      .isString()
      .withMessage("BankCode should be string"),
  ],

  accountNo: [
    param("accountNo")
      .notEmpty()
      .withMessage("accountNo is required")
      .isString()
      .withMessage("accountNo should be string"),
  ],

  openAccount: [
    body("bvn")
      .notEmpty()
      .withMessage("bvn is required")
      .isString()
      .withMessage("bvn should be string"),
    body("nin")
      .notEmpty()
      .withMessage("nin is required")
      .isString()
      .withMessage("nin should be string"),
    body("phone")
      .notEmpty()
      .withMessage("phone is required")
      .isString()
      .withMessage("phone is required"),
  ],

  nipTransfer: [
    body("OTP")
      .notEmpty()
      .withMessage("OTP is required")
      .isString()
      .withMessage("OTP should be string"),
    body("accountNumber")
      .notEmpty()
      .withMessage("accountNumber is required")
      .isString()
      .withMessage("accountNumber should be string"),
    body("customerName")
      .notEmpty()
      .withMessage("customerName is required")
      .isString()
      .withMessage("customerName should be string"),
    body("bankCode")
      .notEmpty()
      .withMessage("bankCode is required")
      .isString()
      .withMessage("bankCode should be string"),
    body("nesid")
      .notEmpty()
      .withMessage("nesid is required")
      .isString()
      .withMessage("nesid should be string"),
    body("nersp").optional(),
    body("bvn")
      .notEmpty()
      .withMessage("bvn is required")
      .isString()
      .withMessage("bvn should be string"),
    body("kycLevel")
      .notEmpty()
      .withMessage("kycLevel is required")
      .isString()
      .withMessage("kycLevel should be string"),
  ],

  intraBankTransfer: [
    body("OTP")
      .notEmpty()
      .withMessage("OTP is required")
      .isString()
      .withMessage("OTP should be string"),
    body("accountNumber")
      .notEmpty()
      .withMessage("accountNumber is required")
      .isString()
      .withMessage("accountNumber should be string"),
    body("beneName")
      .notEmpty()
      .withMessage("beneName is required")
      .isString()
      .withMessage("beneName should be string"),
    body("terms_condition")
      .notEmpty()
      .withMessage("terms_condition is required")
      .isBoolean()
      .withMessage("terms_condition should either true or false"),
  ],

  termsCondition: [
    body("userId")
      .notEmpty()
      .withMessage("userId is required")
      .isString()
      .withMessage("userId should be string"),
  ],
};
