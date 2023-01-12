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
  newsValidation,
  contactFormValidation,
} = require("../../validators/websiteValidator");
const { adminPakamValidation } = require("../../util/auth");

module.exports = (APP) => {
  APP.route("/api/v2/faq")
    .post(adminPakamValidation, faqValidation, checkRequestErrs, addFaq)
    .get(getFaqs);
  APP.route("/api/v2/careers")
    .post(
      adminPakamValidation,
      careerAdValidation,
      checkRequestErrs,
      addCareerAd
    )
    .get(getCareerAds);
  APP.route("/api/v2/news")
    .post(adminPakamValidation, newsValidation, checkRequestErrs, addNews)
    .get(getNews);
  APP.route("/api/v2/contactUs").post(
    contactFormValidation,
    checkRequestErrs,
    contactForm
  );
};
