const { getFaqs, addFaq } = require("../../controllerv2/websiteController");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const { faqValidation } = require("../../validators/websiteValidator");

module.exports = (APP) => {
  APP.route("/api/v2/faq")
    .post(faqValidation, checkRequestErrs, addFaq)
    .get(getFaqs);
};
