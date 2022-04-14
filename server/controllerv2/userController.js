const incidentModel = require("../models/incidentModel");
const { userModel, organisationTypeModel } = require("../models");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  authToken,
  comparePassword,
} = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const request = require("request");
const axios = require("axios");
const uuid = require("uuid");

class UserService {
  static async getClients(req, res) {
    try {
      let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
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
          ],
          roles: "client",
        };
      } else {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createAt: {
            $gte: startDate,
            $lt: endDate,
          },
          roles: "client",
        };
      }
      if (state) criteria.state = state;

      const totalResult = await userModel.countDocuments(criteria);

      // get clients based on page
      const users = await userModel
        .find(criteria)
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
    bodyValidate(req, res);
    try {
      const body = req.body;
      const checkPhone = await userModel.findOne({
        phone: body.phone,
      });
      if (checkPhone) {
        if (checkPhone.verified) {
          return res.status(400).json({
            error: true,
            message: "Phone already exist",
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
        gender: body.gender,
        email: body.email,
        lcd: body.lga,
        uType: body.uType,
        organisationType: body.organisation,
        onesignal_id: body.onesignal_id,
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
          pin_id: send.data.pinId,
          // uType: create.uType,
          // organisationType: create.organisationType,
          organisationName: typename.name,
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
          message: "Invalid credentials",
          statusCode: 400,
        });
      }

      if (!(await comparePassword(req.body.password, user.password))) {
        return res.status(400).json({
          error: true,
          message: "Invalid email or password",
          statusCode: 400,
        });
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

        console.log("res", send.data);

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
            rafflePoints: user.rafflePoints,
            schedulePoints: user.schedulePoints,
            cardID: user.cardID,
            lcd: user.lcd,
            last_logged_in: user.last_logged_in,
            pin_id: send.data.pinId,
            token,
          },
        });
      }
      let signal_id;

      console.log("user id", user.onesignal_id);
      if (user.onesignal_id === "" || user.onesignal_id === " ") {
        const id = uuid.v1().toString();
        console.log("changing", id);
        await userModel.updateOne(
          { email: user.email },
          { $set: { last_logged_in: new Date(), onesignal_id: id } }
        );
      } else {
        console.log("not changing", user.onesignal_id);
        await userModel.updateOne(
          { email: user.email },
          { $set: { last_logged_in: new Date(), onesignal_id: id } }
        );
      }
      // console.log("signalid", signal_id);
      // const update = await userModel.updateOne(
      //   { email: user.email },
      //   { last_logged_in: new Date(), onesignal_id: signal_id }
      // );
      // console.log("update", update);
      const token = authToken(user);
      delete user.password;
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
          rafflePoints: user.rafflePoints,
          schedulePoints: user.schedulePoints,
          onesignal_id: signal_id,
          cardID: user.cardID,
          lcd: user.lcd,
          last_logged_in: user.last_logged_in,
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
}

module.exports = UserService;
