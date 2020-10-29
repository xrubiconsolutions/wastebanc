"use strict";
let CONTROLLER = require("../../controller");
let auth = require("../../util/auth");

/****************************************
 ***** Managing User Routes here ********
 ***** @param APP (express instance)*****
 ****************************************/

const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const fileUpload = multer();

cloudinary.config({
  cloud_name: 'pakam',
  api_key: '865366333135586',
  api_secret: 'ONCON8EsT1bNyhCGlXLJwH2lsy8'
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'some-folder-name',
      format: async (req, file) => ['jpg', 'png', 'mp4'], // supports promises as well
      public_id: (req, file) => 'computed-filename-using-request',
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

  APP.route("/api/getAllClients").get(CONTROLLER.userController.getAllClients);

  APP.route("/api/getAllCollectors").get(
    CONTROLLER.userController.getAllCollectors
  );

  APP.route("/api/getBalance").get(CONTROLLER.userController.getWalletBalance);

  APP.route("/api/user/transactions").get(CONTROLLER.userController.getUserTransactions);

  APP.route("/api/upload/image",fileUpload.single('image')).post(CONTROLLER.userController.uploadProfile);

  APP.route("/api/daily/user").get(CONTROLLER.userController.dailyActive);

  APP.route("/api/update/phone/specifications").post(CONTROLLER.userController.updatePhoneSpecifications)

  APP.route("/api/new/user").get(CONTROLLER.userController.newActiveUser);

  APP.route("/api/user/expiry").get(CONTROLLER.userController.expiryDateFilter);

  APP.route("/api/ads/upload",fileUpload.single('video')).post(CONTROLLER.userController.advertControl);

  APP.route("/api/view/ads").get(CONTROLLER.userController.adsLook);

  APP.route("/api/android/users").get(CONTROLLER.userController.androidUsers);

  APP.route("/api/ios/users").get(CONTROLLER.userController.iosUsers);


  APP.route("/api/desktop/users").get(CONTROLLER.userController.desktopUsers);


  APP.route("/api/device/analytics").get(CONTROLLER.userController.deviceAnalytics);


  APP.route("/api/delete/user").post(CONTROLLER.userController.deleteUser);


  APP.route("/api/users/analytics").get(CONTROLLER.userController.userAnalytics);

  APP.route("/api/total/sales/advert").get(CONTROLLER.userController.totalSalesAdvert);


  APP.route("/api/user/usage").get(CONTROLLER.userController.usageGrowth);

  APP.route("/api/user/analytics/month").get(CONTROLLER.userController.monthFiltering);


  APP.route("/api/user/mobile_carrier").get(CONTROLLER.userController.mobileCarrierAnalytics);








  // APP.route("/api/lawma/get/transaction").get(CONTROLLER.userController.getTransactions);

  APP.route("/getUser").get((req, res) => {
    res.jsonp("cool");
  });
};
