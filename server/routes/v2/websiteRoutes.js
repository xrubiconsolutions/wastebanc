const {
  getFaqs,
  addFaq,
  addCareerAd,
  getCareerAds,
} = require("../../controllerv2/websiteController");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const {
  faqValidation,
  careerAdValidation,
} = require("../../validators/websiteValidator");

module.exports = (APP) => {
  APP.route("/api/v2/faq")
    .post(faqValidation, checkRequestErrs, addFaq)
    .get(getFaqs);
  APP.route("/api/v2/careers")
    .post(careerAdValidation, checkRequestErrs, addCareerAd)
    .get(getCareerAds);
};
