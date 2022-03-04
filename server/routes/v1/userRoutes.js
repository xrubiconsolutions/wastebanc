"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");
const { body, query, check } = require("express-validator");
/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const fileUpload = multer();
//const resumeUpload = multer({ storage: ustorage });

cloudinary.config({
  cloud_name: "pakam",
  api_key: "865366333135586",
  api_secret: "ONCON8EsT1bNyhCGlXLJwH2lsy8",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "some-folder-name",
    format: async (req, file) => ["jpg", "png", "mp4"], // supports promises as well
    public_id: (req, file) => "computed-filename-using-request",
  },
});

const parser = multer({ storage: storage });

module.exports = (APP) => {
  APP.route("/api/register").post(CONTROLLER.userController.registerUser);

  APP.route("/api/fileUpload").post(CONTROLLER.userController.upload);

  APP.route("/api/login").post(CONTROLLER.userController.loginUser);

  APP.route("/api/verify").post(CONTROLLER.userController.verifyPhone);

  APP.route("/api/resendVerification").post(
    CONTROLLER.userController.resendVerification
  );

  APP.route("/api/forgotPassword").post(
    CONTROLLER.userController.forgotPassword
  );

  APP.route("/api/changePassword").post(
    CONTROLLER.userController.changePassword
  );

  APP.route("/api/user/mobile/reset").post(
    CONTROLLER.userController.resetMobile
  );

  APP.route("/api/user/mobile/password").post(
    CONTROLLER.userController.resetMobilePassword
  );

  APP.route("/api/updateUser").post(CONTROLLER.userController.updateUser);

  APP.route("/api/getAllClients").get(
    auth.userCollectorData,
    CONTROLLER.userController.getAllClients
  );

  APP.route("/api/getAllCollectors").get(
    auth.userCollectorData,
    CONTROLLER.userController.getAllCollectors
  );

  APP.route("/api/getBalance").get(CONTROLLER.userController.getWalletBalance);

  APP.route("/api/user/transactions").get(
    CONTROLLER.userController.getUserTransactions
  );

  APP.route("/api/upload/image", fileUpload.single("image")).post(
    CONTROLLER.userController.uploadProfile
  );

  APP.route("/api/daily/user").get(CONTROLLER.userController.dailyActive);

  APP.route("/api/update/phone/specifications").post(
    CONTROLLER.userController.updatePhoneSpecifications
  );

  APP.route("/api/new/user").get(CONTROLLER.userController.newActiveUser);

  APP.route("/api/user/expiry").get(CONTROLLER.userController.expiryDateFilter);

  APP.route("/api/ads/upload").post(CONTROLLER.userController.advertControl);

  APP.route("/api/update/ads").post(CONTROLLER.userController.updateAdvert);

  APP.route("/api/view/ads").get(CONTROLLER.userController.adsLook);

  APP.route("/api/android/users").get(
    auth.adminValidation,
    CONTROLLER.userController.androidUsers
  );

  APP.route("/api/ios/users").get(
    auth.adminValidation,
    CONTROLLER.userController.iosUsers
  );

  APP.route("/api/desktop/users").get(
    auth.adminValidation,
    CONTROLLER.userController.desktopUsers
  );

  APP.route("/api/device/analytics").get(
    auth.adminValidation,
    CONTROLLER.userController.deviceAnalytics
  );

  APP.route("/api/delete/user").post(CONTROLLER.userController.deleteUser);

  APP.route("/api/update/signal").post(
    auth.userValidation,
    CONTROLLER.userController.updateOneSignal
  );

  APP.route("/api/users/analytics").get(
    CONTROLLER.userController.userAnalytics
  );

  APP.route("/api/total/sales/advert").get(
    CONTROLLER.userController.totalSalesAdvert
  );

  APP.route("/api/user/usage").get(CONTROLLER.userController.usageGrowth);

  APP.route("/api/user/analytics/month").get(
    CONTROLLER.userController.monthFiltering
  );

  APP.route("/api/user/report/log").get(
    CONTROLLER.userController.userReportLog
  );

  APP.route("/api/user/mobile_carrier").get(
    auth.adminValidation,
    CONTROLLER.userController.mobileCarrierAnalytics
  );

  APP.route("/api/user/internet_provider").get(
    CONTROLLER.userController.internet_providerAnalytics
  );

  APP.route("/api/trigger/activity").post(
    CONTROLLER.userController.triggerActivity
  );

  APP.route("/api/push/notification").post(
    CONTROLLER.userController.sendPushNotification
  );

  APP.route("/api/inactive/user").get(CONTROLLER.userController.userInactivity);

  APP.route("/api/user/total").get(CONTROLLER.userController.totalGender);

  APP.route("/api/user/uploadresume").post(
    [
      check("fullname", "fullname is required").isString(),
      check("phonenumber", "phonenumber is required").isString(),
      check("email", "email is required").isEmail(),
      check("location", "location is required").isString().optional(),
      check("jobtitle", "jobtitle is required").isString(),
    ],
    CONTROLLER.userController.uploadResume
  );

  APP.route("/api/v2/admin/login").post(
    [
      body("email", "email is required").isString(),
      body("password", "password is required").isString(),
    ],
    CONTROLLER.userController.adminLogin
  );

  APP.route("/api/v2/user/login").post(
    [
      body("phone", "phone is required").isString(),
      body("password", "password is required").isString(),
    ],
    CONTROLLER.userController.loginUserV2
  );
  // APP.route("/api/lawma/get/transaction").get(CONTROLLER.userController.getTransactions);

  APP.route("/api/v2/user/encrypt").post(
    CONTROLLER.userController.passwordEncrypt
  );
  APP.route("/getUser").get((req, res) => {
    res.jsonp("cool");
  });
};
