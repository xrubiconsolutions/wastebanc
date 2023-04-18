const incidentModel = require("../models/incidentModel");
const {
  userModel,
  recentVerificationModel,
  verificationLogModel,
  organisationTypeModel,
  userBinModel,
  scheduleModel,
  scheduleDropModel,
  disbursementRequestModel,
  charityModel,
  insuranceLog,
  userInsuranceModel,
} = require("../models");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  authToken,
  comparePassword,
  paginateResponse,
} = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const request = require("request");
const axios = require("axios");
const uuid = require("uuid");
const VerificationService = require("./verificationController");

class UserService {
  static async getClients(req, res) {
    try {
      const { user } = req;
      const currentScope = user.locationScope;
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        key,
        channel = "mobile",
      } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      let criteria;
      if (key) {
        criteria = {
          $or: [
            { username: { $regex: `.*${key}.*`, $options: "i" } },
            // { cardID: key },
            { fullName: { $regex: `.*${key}.*`, $options: "i" } },
            { gender: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { email: { $regex: `.*${key}.*`, $options: "i" } },
            { address: { $regex: `.*${key}.*`, $options: "i" } },
            { lcd: { $regex: `.*${key}.*`, $options: "i" } },
          ],
          roles: "client",
          channel,
        };
      } else if (start || end) {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
        endDate.setDate(endDate.getDate() + 1);
        criteria = {
          createAt: {
            $gte: startDate,
            $lt: endDate,
          },
          roles: "client",
          channel,
        };
      } else {
        criteria = {
          roles: "client",
          channel,
        };
      }

      if (!currentScope) {
        return res.status(400).json({
          error: true,
          message: "Invalid request",
        });
      }

      if (currentScope === "All") {
        criteria.state = {
          $in: user.states,
        };
      } else {
        criteria.state = currentScope;
      }

      console.log(criteria);
      //if (state) criteria.state = state;

      const totalResult = await userModel.countDocuments(criteria);

      // get clients based on page
      const users = await userModel
        .find(criteria, { password: 0 })
        //.populate("organisationType", "name")
        .sort({ createAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          users,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }

    // const [startDate, endDate] = [new Date(start), new Date(end)];
    // const criteria = {
    //   createAt: {
    //     $gte: startDate,
    //     $lt: endDate,
    //   },
    //   roles: "client",
    endDate.setDate(endDate.getDate() + 1);
    //   verified: true,
    // };
    // if (state) criteria.state = state;

    // try {
    //   // get length of users within given date range
    //   const totalResult = await userModel.countDocuments(criteria);

    //   // get all users meeting all criteria
    //   const users = await userModel
    //     .find(criteria)
    //     .sort({ createdAt: -1 })
    //     .skip((page - 1) * resultsPerPage)
    //     .limit(resultsPerPage);

    //   return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
    //     users,
    //     totalResult,
    //     page,
    //     resultsPerPage,
    //   });
    // } catch (error) {
    //   console.log(error);
    //   sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    // }
  }

  static async searchClients(req, res) {
    let { state, page = 1, key, resultsPerPage = 20 } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = {
      roles: "client",
      verified: true,
      $or: [
        { username: { $regex: `.*${key}.*`, $options: "i" } },
        // { cardID: key },
        { fullName: { $regex: `.*${key}.*`, $options: "i" } },
        { gender: { $regex: `.*${key}.*`, $options: "i" } },
        { phone: { $regex: `.*${key}.*`, $options: "i" } },
        { email: { $regex: `.*${key}.*`, $options: "i" } },
      ],
    };
    if (state) criteria.state = state;

    try {
      // get length of clients with completion status and provided field value
      const totalResult = await userModel.countDocuments(criteria);

      // get clients based on page
      const clients = await userModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        clients,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }

  static async register(req, res) {
    //bodyValidate(req, res);
    try {
      const onesignal_id = uuid.v1().toString();
      const body = req.body;
      const checkPhone = await userModel.findOne({
        phone: body.phone,
      });
      if (!body.terms_condition || body.terms_condition == false) {
        return res.status(400).json({
          error: true,
          message: "Please accept terms and condition",
          data: null,
          statusCode: 400,
        });
      }
      if (checkPhone) {
        if (checkPhone.verified) {
          return res.status(400).json({
            error: true,
            message: "Phone number already exist",
          });
        }

        const phoneNo = String(checkPhone.phone).substring(1, 11);
        const token = authToken(phoneNo);
        const msg = {
          api_key:
            "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
          message_type: "NUMERIC",
          to: `+234${phoneNo}`,
          from: "N-Alert",
          channel: "dnd",
          pin_attempts: 10,
          pin_time_to_live: 5,
          pin_length: 4,
          pin_placeholder: "< 1234 >",
          message_text:
            "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
          pin_type: "NUMERIC",
        };

        const options = {
          method: "POST",
          url: "https://termii.com/api/sms/otp/send",
          headers: {
            "Content-Type": ["application/json", "application/json"],
          },
          body: JSON.stringify(msg),
        };

        const send = await axios.post(options.url, options.body, {
          headers: options.headers,
        });

        console.log("res", send.data);

        return res.status(200).json({
          error: false,
          message: "user created successfully",
          data: {
            _id: checkPhone._id,
            fullname: checkPhone.fullname,
            phone: checkPhone.phone,
            email: checkPhone.email || "",
            gender: checkPhone.gender,
            country: checkPhone.country,
            state: checkPhone.state,
            lga: checkPhone.lga,
            pin_id: send.data.pinId,
            verified: checkPhone.verified,
            terms_condition: checkPhone.terms_condition || false,
            isChatAdmin: checkPhone.isChatAdmin || false,
            // uType: create.uType,
            // organisationType: create.organisationType,
            //organisationName: typename.name,
            token,
          },
        });
      }
      if (body.email) {
        const checkEmail = await userModel.findOne({
          email: body.email,
        });
        if (checkEmail) {
          return res.status(400).json({
            error: true,
            message: "Email already exist",
          });
        }
      }
      let typename;
      if (body.uType === 2) {
        if (!body.organisation) {
          return res.status(422).json({
            error: true,
            message: "select a commerical type",
          });
        } else {
          typename = await organisationTypeModel.findById(body.organisation);
          console.log(typename);
          if (!typename) {
            return res.status(400).json({
              error: true,
              message: "Organisation type not found",
            });
          }
        }
      } else {
        typename = await organisationTypeModel.findOne({
          default: true,
        });
      }

      const create = await userModel.create({
        fullname: body.fullname,
        username: body.fullname,
        phone: body.phone,
        country: body.country,
        state: body.state,
        password: await encryptPassword(body.password),
        gender: body.gender.toLowerCase(),
        email: body.email,
        lcd: body.lga,
        uType: body.uType,
        organisationType: body.organisation,
        //onesignal_id: body.onesignal_id,
        address: body.address,
        onesignal_id,
        terms_condition: body.terms_condition || false,
      });

      //fine

      const token = authToken(create);
      await userModel.updateOne(
        {
          email: create.email,
        },
        {
          $set: {
            cardID: create._id,
          },
        }
      );

      const phoneNo = String(create.phone).substring(1, 11);
      const msg = {
        api_key:
          "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
        message_type: "NUMERIC",
        to: `+234${phoneNo}`,
        from: "N-Alert",
        channel: "dnd",
        pin_attempts: 10,
        pin_time_to_live: 5,
        pin_length: 4,
        pin_placeholder: "< 1234 >",
        message_text:
          "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
        pin_type: "NUMERIC",
      };
      const options = {
        method: "POST",
        url: "https://termii.com/api/sms/otp/send",
        headers: {
          "Content-Type": ["application/json", "application/json"],
        },
        body: JSON.stringify(msg),
      };

      const send = await axios.post(options.url, options.body, {
        headers: options.headers,
      });

      console.log("res", send.data);

      return res.status(200).json({
        error: false,
        message: "user created successfully",
        data: {
          _id: create._id,
          fullname: create.fullname,
          phone: create.phone,
          email: create.email || "",
          gender: create.gender,
          country: create.country,
          state: create.state,
          lga: create.lga,
          terms_condition: create.terms_condition,
          pin_id: send.data.pinId,
          // uType: create.uType,
          // organisationType: create.organisationType,
          organisationName: typename.name,
          requestedAmount: create.requestedAmount,
          isChatAdmin: create.isChatAdmin || false,
          token,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async getAllUserReportLogs(req, res) {
    try {
      const usersIncidents = await incidentModel.aggregate([
        {
          $group: {
            _id: "$caller.phoneNumber",
            incidents: {
              $push: "$$ROOT",
            },
          },
        },
        {
          $project: {
            userPhoneNo: "$_id",
            incidents: 1,
            _id: 0,
          },
        },
      ]);

      return res.status(200).json({
        error: false,
        message: "success!",
        data: usersIncidents,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async getUserReportLogs(req, res) {
    try {
      const { phone } = req.user;
      let { page = 1, resultsPerPage = 20, start, end } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      const criteria = { "caller.phoneNumber": phone };

      if (start && end) {
        criteria.createdAt = {
          $gte: new Date(start),
          $lt: new Date(end),
        };
      }
      //   count of report logs
      const totalResult = await incidentModel.countDocuments(criteria);

      const userReportLogs = await incidentModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success!",
        data: {
          userReportLogs,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async verifyOTP(req, res) {
    const phone = req.body.phone;
    const token = req.body.token;
    const pin_id = req.body.pin_id;

    console.log("phone", phone);

    const user = await userModel.findOne({
      phone,
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Phone number does not exist",
      });
    }

    try {
      var data = {
        api_key:
          "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
        pin_id: pin_id,
        pin: token,
      };

      const send = await axios.post(
        "https://termii.com/api/sms/otp/verify",
        JSON.stringify(data),
        {
          headers: {
            "Content-Type": ["application/json", "application/json"],
          },
        }
      );

      //console.log(send.data);

      //     pinId: '41a11125-e3c9-4f66-9f94-596ba0d2f115',
      // verified: true,
      // msisdn: '+2349065180963',
      // attemptsRemaining: 0
      if (send.data.verified === true) {
        await userModel.updateOne(
          {
            phone,
          },
          { verified: true }
        );

        const token = authToken(user);

        return res.status(200).json({
          error: false,
          message: "Token verified successfully",
          data: {
            _id: user._id,
            fullname: user.fullname,
            phone: user.phone,
            email: user.email || "",
            gender: user.gender,
            country: user.country,
            state: user.state,
            lga: user.lga,
            verified: true,

            token,
          },
        });
      } else {
        return res.status(400).json({
          error: true,
          message: send.data.verified || "Invalid or Expired Token",
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async login(req, res) {
    try {
      const user = await userModel.findOne({
        phone: req.body.phone,
      });
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "Incorrect phone number or password",
          statusCode: 400,
        });
      }

      if (user.status == "deleted") {
        return res.status(400).json({
          error: true,
          message: "Account disabled contact support team",
          statusCode: 400,
        });
      }

      if (user.status == "disabled") {
        return res.status(400).json({
          error: true,
          message: "Account disabled contact support team",
          statusCode: 400,
        });
      }

      const compare = await comparePassword(req.body.password, user.password);
      console.log("compare", compare);
      if (!compare) {
        return res.status(400).json({
          error: true,
          message: "Incorrect phone number or password",
          statusCode: 400,
        });
      }

      if (!user.terms_condition || user.terms_condition == false) {
        console.log("here");
        return res.status(200).json({
          error: true,
          message: "Please accept terms and condition",
          data: { userId: user._id },
          statusCode: 402,
        });
      }

      let ledgerBalance = 0;
      if (user.ledgerPoints) {
        ledgerBalance = user.ledgerPoints
          .map((x) => x.point)
          .reduce((acc, curr) => acc + curr, 0);
      }
      if (!user.verified) {
        const phoneNo = String(user.phone).substring(1, 11);
        const token = authToken(user);
        const msg = {
          api_key:
            "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
          message_type: "NUMERIC",
          to: `+234${phoneNo}`,
          from: "N-Alert",
          channel: "dnd",
          pin_attempts: 10,
          pin_time_to_live: 5,
          pin_length: 4,
          pin_placeholder: "< 1234 >",
          message_text:
            "Your Pakam Verification code is < 1234 >. It expires in 5 minutes",
          pin_type: "NUMERIC",
        };

        const options = {
          method: "POST",
          url: "https://termii.com/api/sms/otp/send",
          headers: {
            "Content-Type": ["application/json", "application/json"],
          },
          body: JSON.stringify(msg),
        };

        const send = await axios.post(options.url, options.body, {
          headers: options.headers,
        });

        return res.status(200).json({
          error: false,
          message: "Phone number not verified",
          statusCode: 200,
          data: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            fullname: user.fullname,
            gender: user.gender,
            country: user.country,
            state: user.state,
            username: user.username,
            othernames: user.othernames,
            address: user.address,
            profile_picture: user.profile_picture,
            roles: user.roles,
            countryCode: user.countryCode,
            verified: user.verified,
            availablePoints: user.availablePoints,
            ledgerBalance,
            rafflePoints: user.rafflePoints,
            schedulePoints: user.schedulePoints,
            cardID: user.cardID,
            lcd: user.lcd,
            last_logged_in: user.last_logged_in,
            pin_id: send.data.pinId,
            isChatAdmin: user.isChatAdmin || false,
            token,
          },
        });
      }

      let signal_id;

      //console.log("user id", user.onesignal_id);
      if (
        !user.onesignal_id ||
        user.onesignal_id === "" ||
        user.onesignal_id === " "
      ) {
        signal_id = uuid.v1().toString();
        console.log("changing", signal_id);
        await userModel.updateOne(
          { email: user.email },
          {
            $set: {
              last_logged_in: new Date(),
              onesignal_id: signal_id,
              firstLogin: false,
            },
          }
        );
      } else {
        signal_id = user.onesignal_id;
        console.log("not changing", user.onesignal_id);
        await userModel.updateOne(
          { email: user.email },
          { $set: { last_logged_in: new Date(), firstLogin: false } }
        );
      }

      const token = authToken(user);
      delete user.password;

      const userInsurance = await userInsuranceModel.find({
        expiration_date: {
          $gte: new Date(),
        },
      });
      console.log({ userInsurance });
      return res.status(200).json({
        error: false,
        message: "Login successfull",
        statusCode: 200,
        data: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          fullname: user.fullname,
          gender: user.gender,
          country: user.country,
          state: user.state,
          username: user.username,
          othernames: user.othernames,
          address: user.address,
          profile_picture: user.profile_picture,
          roles: user.roles,
          countryCode: user.countryCode,
          verified: user.verified,
          availablePoints: user.availablePoints,
          ledgerBalance,
          rafflePoints: user.rafflePoints,
          schedulePoints: user.schedulePoints,
          onesignal_id: signal_id,
          cardID: user.cardID,
          lcd: user.lcd,
          last_logged_in: user.last_logged_in,
          firstLogin: user.firstLogin,
          terms_condition: user.terms_condition,
          requestedAmount: user.requestedAmount,
          isChatAdmin: user.isChatAdmin || false,
          token,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async resetPassword(req, res) {
    const { email, phone, password, confirmPassword, role } = req.body;

    try {
      // get user account
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

      //return error if passwords do not match
      if (password !== confirmPassword) {
        return res.status(400).json({
          error: true,
          message: "Passwords do not match",
        });
      }
      const field = email ? { email } : { phone };
      // get verification details
      const criteria = {
        verificationType: "AUTH",
        userRole: role,
        status: "VERIFIED",
        ...field,
      };
      const verification = await recentVerificationModel.findOne(criteria);

      // return error if data not found
      if (!verification)
        return res.status(400).json({
          error: true,
          message: "Reset Verification invalid, do request for new token",
        });
      console.log("The verification obj: ", verification, verification.token);

      // archive verification data in log
      const log = await VerificationService.createVerificationLog(
        account._id,
        "AUTH",
        verification.token,
        role
      );

      // generate password hash and update account password
      const passwordHash = await encryptPassword(password);
      account.password = passwordHash;
      await account.save();

      // delete verification data after archiving it
      await recentVerificationModel.deleteOne(criteria);

      // send success message
      return res.status(200).json({
        error: false,
        message: "Password reset success!",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async acceptTermsCondition(req, res) {
    try {
      const { userId } = req.body;
      const user = await userModel.findOne({ _id: userId });
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "User not found",
        });
      }
      await userModel.updateOne(
        { _id: user._id },
        {
          terms_condition: true,
        }
      );

      // if (!accept) {
      //   return res.status(400).json({
      //     error: true,
      //     message: "Invaild user",
      //   });
      // }

      const token = authToken(user);
      delete user.password;

      return res.status(200).json({
        error: false,
        message: "Terms and condition accepted successfully",
        data: {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          fullname: user.fullname,
          gender: user.gender,
          country: user.country,
          state: user.state,
          username: user.username,
          othernames: user.othernames,
          address: user.address,
          profile_picture: user.profile_picture,
          roles: user.roles,
          countryCode: user.countryCode,
          verified: user.verified,
          availablePoints: user.availablePoints,
          rafflePoints: user.rafflePoints,
          schedulePoints: user.schedulePoints,
          onesignal_id: user.signal_id,
          cardID: user.cardID,
          lcd: user.lcd,
          last_logged_in: user.last_logged_in,
          firstLogin: user.firstLogin,
          terms_condition: true,
          isChatAdmin: user.isChatAdmin || false,
          token,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { user } = req;
      const result = await userModel.findById(user._id);
      if (!result) {
        return res.status(400).json({
          error: true,
          message: "User not found",
        });
      }
      const newResult = { ...result.toJSON() };

      delete newResult._id;

      const storeInBin = await userBinModel.create(newResult);
      if (storeInBin) {
        console.log("here");
        result.deleteOne();
      }

      return res.status(200).json({
        error: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error deleting User",
      });
    }
  }

  //TODO
  // get user details
  static async userDetails(req, res) {
    try {
      const { userId } = req.params;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "User not found",
        });
      }
      const totalSchedulePickup = await scheduleModel.countDocuments({
        client: user.email,
      });
      const totalScheduleDrop = await scheduleDropModel.countDocuments({
        clientId: user._id.toString(),
      });

      const pendingSchedulePickup = await scheduleModel.countDocuments({
        client: user.email,
        completionStatus: "pending",
      });

      const completedSchedulePickup = await scheduleModel.countDocuments({
        client: user.email,
        completionStatus: "completed",
      });

      const missedSchedulePickup = await scheduleModel.countDocuments({
        client: user.email,
        completionStatus: "missed",
      });

      return res.status(200).json({
        error: false,
        message: "User Details",
        data: {
          firstName: user.fullname,
          phoneNumber: user.phone,
          gender: user.gender,
          lcd: user.lcd,
          walletBalance: user.availablePoints,
          address: user.address,
          createdAt: user.createAt,
          totalSchedulePickup,
          pendingSchedulePickup,
          completedSchedulePickup,
          missedSchedulePickup,
          totalScheduleDrop,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error deleting User",
      });
    }
  }

  // get user payment to bank requests

  static async userBankPayoutRequests(req, res) {
    try {
      const { userId } = req.params;
      let {
        page = 1,
        resultsPerPage = 20,
        key,
        start,
        end,
        status = "initiated",
      } = req.query;

      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "User not found",
        });
      }

      if (!key && (!start || !end))
        return res.status(422).json({
          error: true,
          message: "Supply a date range (start and end) or key to search",
        });

      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }

      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);

      let criteria;

      if (key) {
        criteria = {
          $or: [
            { destinationAccount: { $regex: `.*${key}.*`, $options: "i" } },
            { bankName: { $regex: `.*${key}.*`, $options: "i" } },
            { status: { $regex: `.*${key}.*`, $options: "i" } },
            { beneName: { $regex: `.*${key}.*`, $options: "i" } },
            //{ withdrawalAmount: { $eq: parseFloat(key) } },
          ],
          user: user._id,
          status,
        };
      } else if (key && parseFloat(key)) {
        criteria = {
          $or: [
            { destinationAccount: { $regex: `.*${key}.*`, $options: "i" } },
            { bankName: { $regex: `.*${key}.*`, $options: "i" } },
            { status: { $regex: `.*${key}.*`, $options: "i" } },
            { beneName: { $regex: `.*${key}.*`, $options: "i" } },
            { withdrawalAmount: { $eq: parseFloat(key) } },
          ],
          user: user._id,
          status,
        };
      } else if (startDate || endDate) {
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          user: user._id,
          status,
        };
      } else {
        criteria = {
          user: user._id,
          status,
        };
      }

      const totalPayments = await disbursementRequestModel.countDocuments(
        criteria
      );

      const payments = await disbursementRequestModel.aggregate([
        {
          $match: criteria,
        },
        {
          $lookup: {
            from: "transactions",
            localField: "transactions._id",
            foreignField: "_id",
            as: "transactions",
          },
        },
        {
          $project: {
            otp: 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * resultsPerPage,
        },
        {
          $limit: resultsPerPage,
        },
      ]);
      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          payments,
          totalResult: totalPayments,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalPayments / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error retrieving data",
      });
    }
  }

  // get user payment to charity requests
  static async userCharityPayments(req, res) {
    try {
      const { userId } = req.params;
      let { page = 1, resultsPerPage = 20, key, start, end } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(400).json({
          error: true,
          message: "User not found",
        });
      }

      if (!key && (!start || !end))
        return res.status(422).json({
          error: true,
          message: "Supply a date range (start and end) or key to search",
        });

      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }

      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);

      let criteria;

      if (key && parseFloat(key)) {
        criteria = {
          $or: [{ amount: { $eq: parseFloat(key) } }],
          cardID: user._id.toString(),
        };
      } else if (startDate || endDate) {
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          cardID: user._id.toString(),
        };
      } else {
        criteria = {
          cardID: user._id.toString(),
        };
      }

      console.log("c", criteria);

      const totalCharityPayout = await charityModel.countDocuments(criteria);
      const charityPayouts = await charityModel.aggregate([
        {
          $match: criteria,
        },
        {
          $lookup: {
            from: "charityorganisations",
            localField: "charityOrganisation",
            foreignField: "_id",
            as: "charityOrganisation",
          },
        },
        {
          $unwind: {
            path: "$charityOrganisation",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            "charityOrganisation._id": 0,
            "charityOrganisation.bank": 0,
            "charityOrganisation.accountNumber": 0,
            "charityOrganisation.createdAt": 0,
            "charityOrganisation.updatedAt": 0,
            "charityOrganisation.__v": 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $skip: (page - 1) * resultsPerPage,
        },
        {
          $limit: resultsPerPage,
        },
      ]);

      return res.status(200).json({
        error: false,
        message: "Data retrieved",
        data: {
          charityPayouts,
          totalResult: totalCharityPayout,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalCharityPayout / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error retrieving data",
      });
    }
  }

  // get user insurance purchases
  static async userInsurancePurchases(req, res) {
    const { userId } = req.params;
    const { key } = req.query;
    try {
      // find user or throw error if no user found
      const user = await userModel.findById(userId);
      if (!user)
        return res.status(404).json({
          error: true,
          message: "Account not found",
        });

      // gather the user insurance history and return
      const response = await paginateResponse({
        model: userInsuranceModel,
        query: {},
        searchQuery: {
          $or: [
            { plan_name: { $regex: `.*${key}.*`, $options: "i" } },
            { product_id: { $regex: `.*${key}.*`, $options: "i" } },
            { price: { $regex: `.*${key}.*`, $options: "i" } },
          ],
        },
        startDate: "2020-01-01",
        endDate: new Date(),
        ...req.query,
        title: "data",
        projection: {
          _id: 1,
          payment_plan: 1,
          plan_name: 1,
          product_id: 1,
          price: 1,
          expiration_date: 1,
          activation_date: 1,
          policy_id: 1,
        },
      });
      return res.status(200).json(response);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error retrieving data",
      });
    }
  }

  //get insurance users

  static async insuranceUser(req, res) {
    let {
      page = 1,
      resultsPerPage = 20,
      key,
      start = "2020-01-01",
      end = new Date(),
    } = req.query;
    // construct pagination data
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (!key && (!start || !end))
      return res.status(422).json({
        error: true,
        message: "Supply a date range (start and end) or key to search",
      });

    if (new Date(start) > new Date(end)) {
      return res.status(400).json({
        error: true,
        message: "Start date cannot be greater than end date",
      });
    }

    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);

    // construct criteria
    let criteria;

    if (key) {
      criteria = {
        $or: [
          {
            phone: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            first_name: {
              $regex: `.*${key}.*`,
              $options: "i",
            },
          },
          {
            last_name: {
              $regex: `.*${key}.*`,
              $options: "i",
            },
          },
          { price: { $regex: `.*${key}.*`, $options: "i" } },
          { plan_name: { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };
    } else if (startDate || endDate) {
      criteria = {
        activation_date: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    } else {
      criteria = {};
    }

    const paginationQuery = [
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: (page - 1) * resultsPerPage,
      },
      {
        $limit: resultsPerPage,
      },
    ];

    const pipeline = [
      {
        $match: criteria,
      },
      {
        $group: {
          _id: "$user",
          purchases: {
            $push: "$$ROOT",
          },
        },
      },
      {
        $project: {
          lastPurchase: {
            $last: "$purchases",
          },
          userId: "$_id",
          _id: 0,
        },
      },
      {
        $project: {
          _id: "$lastPurchase._id",
          userId: 1,
          plan_name: "$lastPurchase.plan_name",
          price: "$lastPurchase.price",
          phone: "$lastPurchase.phone",
          activation_date: "$lastPurchase.activation_date",
          expiration_date: "$lastPurchase.expiration_date",
          createdAt: "$lastPurchase.createdAt",
          fullName: {
            $concat: [
              "$lastPurchase.first_name",
              " ",
              "$lastPurchase.last_name",
            ],
          },
        },
      },
    ];

    const countCriteria = [
      ...pipeline,
      {
        $count: "createdAt",
      },
    ];

    try {
      let totalResult = await userInsuranceModel.aggregate(countCriteria);
      const users = await userInsuranceModel.aggregate([
        ...pipeline,
        ...paginationQuery,
      ]);

      let totalValue;
      if (totalResult.length == 0) {
        totalValue = 0;
      } else {
        totalValue = Object.values(totalResult[0])[0];
      }

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          users,
          totalResult: totalValue,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalValue / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error retrieving data",
      });
    }
  }

  // completed
}

module.exports = UserService;
