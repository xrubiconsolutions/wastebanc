const {
  getFaqs,
  addFaq,
  addCareerAd,
  getCareerAds,
  contactForm,
} = require("../../controllerv2/websiteController");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const {
  faqValidation,
  careerAdValidation,
  contactFormValidation,
} = require("../../validators/websiteValidator");

module.exports = (APP) => {
  APP.route("/api/v2/faq")
    .post(faqValidation, checkRequestErrs, addFaq)
    .get(getFaqs);
  APP.route("/api/v2/careers")
    .post(careerAdValidation, checkRequestErrs, addCareerAd)
    .get(getCareerAds);
  APP.route("/api/v2/contactUs").post(
    contactFormValidation,
    checkRequestErrs,
    contactForm
  );
};
