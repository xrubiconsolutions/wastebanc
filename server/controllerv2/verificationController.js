const {
  verificationLogModel,
  recentVerificationModel,
  userModel,
  collectorModel,
} = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const { VERIFICATION_OBJ } = require("../util/constants");

const ROLES_ENUM = Object.freeze(["COLLECTOR", "CLIENT", "ADMIN"]);

class VerificationService {
  static async requestAuthToken(req, res) {
    const { email, phone, role } = req.body;
    try {
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

      // create verification log
      const data = await VerificationService.createVerification(
        email ? { email } : { phone },
        VERIFICATION_OBJ.AUTH
      );
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
      const user = await VerificationService.findAccount(
        email ? { email } : { phone },
        role
      );

      if (!user)
        return res.status(404).json({
          error: true,
          message: "Account not found!",
        });

      const { error, type, data } = await VerificationService.verifyToken(
        email ? { email } : { phone },
        verificationType,
        token,
        role
      );
      if (error)
        return res.status(200).json({
          error: true,
          message: type,
        });

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

  static async createVerification(field, verificationType = "") {
    // generate token and construct log details
    const token = COMMON_FUN.generateRandomString();
    const logDetails = { verificationType, token, ...field };

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
    token = ""
  ) {
    // generate token and construct log details
    const logDetails = { userId, verificationType, token };

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
    };
    const now = Date.now();
    const MAX_ATTEMPT = 5;
    try {
      const verification = await recentVerificationModel.findOne(logDetails);
      let state = { attemptsExceeded: false, expired: false };

      //   error types
      const ERROR_OBJ = Object.freeze({
        ATTEMPTS_EXCEEDED: "Allowed Attempts Exceeded",
        EXPIRED: "Expiration time exceeded",
        NOT_FOUND: "No log found",
        WRONG_TOKEN: "Token does not match",
      });
      if (!verification) return { error: true, type: ERROR_OBJ.NOT_FOUND };

      // destructure some entry value
      const { expiryTime, token: _token, attempts } = verification.toObject();

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
        if (attempts === MAX_ATTEMPT) {
          await verification.delete();
        }
        return { error: true, type: ERROR_OBJ.WRONG_TOKEN };
      }

      const account = await VerificationService.findAccount(field, role);
      const logData = { userId: account._id, verificationType, token };

      //   verify request if all conditions are met
      const result = await verificationLogModel.create(logData);

      // delete verification entry
      await verification.delete();

      return {
        error: false,
        data: result,
      };
    } catch (error) {
      console.log(error);
      return Promise.reject(error);
    }
  }

  static async findAccount(field, role) {
    try {
      let account;
      // find user account
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
        default:
      }
      return account;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = VerificationService;
