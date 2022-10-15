const {
  verificationLogModel,
  recentVerificationModel,
  userModel,
  collectorModel,
  organisationModel,
} = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const { VERIFICATION_OBJ, ROLES_ENUM } = require("../util/constants");
const sgMail = require("@sendgrid/mail");

class VerificationService {
  static async requestAuthToken(req, res) {
    const { email, phone, role } = req.body;
    try {
      // fetch user account based email/phone and role
      const account = await VerificationService.findAccount(
        email ? { email } : { phone },
        role
      );
      //  return error if account not found
      if (!account)
        return res.status(404).json({
          error: true,
          message: "Account not found!",
        });

      // create recent verification
      const data = await VerificationService.createVerification(
        email ? { email } : { phone },
        VERIFICATION_OBJ.AUTH,
        role
      );
      // send email
      sgMail.setApiKey(
        "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"
      );

      const msg = {
        to: `${data.email}`,
        from:"info@pakam.ng",
        subject:"Passwowrd Reset token",
        text:`Hello, Your password reset request was recieved below is your reset token ${data.token}
          Best Regards

          Pakam Technologies
        `
      };
      await sgMail.send(msg);
      //   return response
      return res.status(201).json({
        error: false,
        message: "Reset token sent successfully!",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async authTokenVerify(req, res) {
    const { verificationType, token, role, email, phone } = req.body;
    try {
      // find user account based on email/phone and role
      const user = await VerificationService.findAccount(
        email ? { email } : { phone },
        role
      );

      //  return error if account not found
      if (!user)
        return res.status(404).json({
          error: true,
          message: "Account not found!",
        });

      // verify the token
      const { error, type, data } = await VerificationService.verifyToken(
        email ? { email } : { phone },
        verificationType,
        token,
        role
      );

      // return verification error is it exist
      if (error)
        return res.status(400).json({
          error: true,
          message: type,
        });

      // return success message
      return res.status(200).json({
        error: false,
        message: "Token Verified!",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async createVerification(field, verificationType = "", role = "") {
    // generate token and construct log details
    const token = COMMON_FUN.generateRandomString();
    const logDetails = { verificationType, token, userRole: role, ...field };

    try {
      // delete exisiting verification document for user
      await recentVerificationModel.deleteMany({ ...field, verificationType });
      // create verification log
      const result = await recentVerificationModel.create(logDetails);
      // remove token and other values from result
      const { __v, updatedAt, token: t, ...data } = result.toObject();

      //   return log doc
      return Promise.resolve(data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  static async createVerificationLog(
    userId = "",
    verificationType = "",
    token = "",
    role = ""
  ) {
    // generate token and construct log details
    const logDetails = { userId, verificationType, token, userRole: role };

    try {
      // create verification log
      const result = await verificationLogModel.create(logDetails);
      // remove token and other values from result
      const { __v, updatedAt, token: t, ...data } = result.toObject();

      //   return log doc
      return Promise.resolve(data);
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  static async verifyToken(
    field,
    verificationType = "",
    token = "",
    role = ""
  ) {
    const logDetails = {
      ...field,
      verificationType,
      userRole: role,
    };
    const now = Date.now();
    const MAX_ATTEMPT = 5;
    try {
      const verification = await recentVerificationModel.findOne(logDetails);

      //   error types
      const ERROR_OBJ = Object.freeze({
        ATTEMPTS_EXCEEDED: "Allowed Attempts Exceeded",
        EXPIRED: "Expiration time exceeded",
        NOT_FOUND: "Token log not found",
        WRONG_TOKEN: "Token does not match",
        ALREADY_VERIFIED: "Token already verified",
      });
      if (!verification) return { error: true, type: ERROR_OBJ.NOT_FOUND };

      // destructure some entry value
      const {
        expiryTime,
        token: _token,
        attempts,
        status,
      } = verification.toObject();

      // return message if allready verified
      if (status === "VERIFIED")
        return { error: true, type: ERROR_OBJ.ALREADY_VERIFIED };

      if (attempts > MAX_ATTEMPT) {
        verification.status === "NOT_VERIFIED";
        await verification.save();
        return { error: true, type: ERROR_OBJ.ATTEMPTS_EXCEEDED };
      }

      //increment attempts
      verification.attempts++;
      await verification.save();

      //check token validity
      if (now > expiryTime) {
        await verification.delete();
        return { error: true, type: ERROR_OBJ.EXPIRED };
      }

      if (_token !== token) {
        // delete token after failed and exhausted attempt trials
        if (attempts === MAX_ATTEMPT) {
          await verification.delete();
        }
        return { error: true, type: ERROR_OBJ.WRONG_TOKEN };
      }

      const account = await VerificationService.findAccount(field, role);
      const logData = {
        userId: account._id,
        verificationType,
        token,
        userRole: role,
      };

      //   verify request if all conditions are met
      verification.status = "VERIFIED";
      await verification.save();
      // const result = await verificationLogModel(logData);

      return {
        error: false,
        data: verification,
      };
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  static async findAccount(field, role) {
    try {
      let account;
      // find user account based on provided role
      switch (role) {
        case ROLES_ENUM[0]:
          account = await collectorModel.findOne(field);
          break;
        case ROLES_ENUM[1]:
          account = await userModel.findOne(field);
          break;
        case ROLES_ENUM[2]:
          account = await userModel.findOne(field);
          break;
        case ROLES_ENUM[3]:
          account = await organisationModel.findOne(field);
          break;
        default:
      }
      return account;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VerificationService;
