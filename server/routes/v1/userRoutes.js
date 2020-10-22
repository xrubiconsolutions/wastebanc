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


cloudinary.config({
  cloud_name: 'pakam',
  api_key: '865366333135586',
  api_secret: 'ONCON8EsT1bNyhCGlXLJwH2lsy8'
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'some-folder-name',
      format: async (req, file) => 'jpg', // supports promises as well
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

  APP.route("/api/upload/image"
  ).post(CONTROLLER.userController.uploadProfile);

  APP.route("/api/daily/user").get(CONTROLLER.userController.dailyActive);

  APP.route("/api/new/user").get(CONTROLLER.userController.newActiveUser);

  APP.route("/api/user/expiry").get(CONTROLLER.userController.expiryDateFilter);

  APP.route("/api/ads/upload").post(CONTROLLER.userController.advertControl);

  APP.route("/api/view/ads").get(CONTROLLER.userController.adsLook);





  // APP.route("/api/lawma/get/transaction").get(CONTROLLER.userController.getTransactions);

  APP.route("/getUser").get((req, res) => {
    res.jsonp("cool");
  });
};
