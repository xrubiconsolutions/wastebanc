const VerificationService = require("../../controllerv2/verificationController.js");
const { checkRequestErrs } = require("../../util/commonFunction.js");
const {
  authVerification,
  verifyToken,
} = require("../../validators/verificationValidator");

module.exports = (APP) => {
  APP.route("/api/v2/auth-token").post(
    authVerification,
    checkRequestErrs,
    VerificationService.requestAuthToken
  );
  APP.route("/api/v2/auth-token-verify").put(
    verifyToken,
    checkRequestErrs,
    VerificationService.authTokenVerify
  );
};
