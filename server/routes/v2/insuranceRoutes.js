const InsuranceController = require("../../controllerv2/insuranceController");
const {
  adminPakamValidation,
  recyclerValidation,
  userValidation,
} = require("../../util/auth");

const {
  purchaseHealthInsuranceValidator,
} = require("../../validators/insuranceValidator");
const { checkRequestErrs } = require("../../util/commonFunction.js");

module.exports = (APP) => {
  APP.route("/api/insurance/health/product-lists").get(
    userValidation,
    InsuranceController.healthProductLists
  );

  APP.route("/api/insurance/health/purchase").post(
    userValidation,
    purchaseHealthInsuranceValidator,
    checkRequestErrs,
    InsuranceController.purchaseHealthInsuance
  );
};
