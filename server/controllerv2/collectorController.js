const {
  collectorModel,
  collectorBinModel,
  wastebancAgentModel,
} = require("../models");
const geofenceModel = require("../models/geofenceModel");
const organisationModel = require("../models/organisationModel");
const scheduleModel = require("../models/scheduleModel");
const transactionModel = require("../models/transactionModel");
const dropOffModel = require("../models/dropOffModel");
const passwordsModel = require("../models/passwordsModel");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  authToken,
  comparePassword,
  generateRandomString,
} = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const { validationResult, body } = require("express-validator");
const axios = require("axios");
const request = require("request");
const uuid = require("uuid");

class CollectorService {
  static async aggregateQuery({ criteria, page = 1, resultsPerPage = 20 }) {
    const paginationQuery = [
      {
        $match: criteria,
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
    ];

    try {
      const pipeline = [
        {
          $lookup: {
            from: "schedulepicks",
            let: {
              collector: {
                $toString: "$_id",
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$collectedBy", "$$collector"],
                  },
                },
              },
              {
                $group: {
                  _id: "$completionStatus",
                  totalCount: {
                    $sum: 1,
                  },
                },
              },
              {
                $unwind: {
                  path: "$totalCount",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "schedules",
          },
        },
        {
          $project: {
            password: 0,
          },
        },
      ];

      const countCriteria = [
        {
          $match: criteria,
        },
        ...pipeline,
        {
          $count: "createdAt",
        },
      ];
      let totalResult = await collectorModel.aggregate(countCriteria);

      const collectors = await collectorModel.aggregate([
        ...pipeline,
        ...paginationQuery,
      ]);

      let totalValue;
      if (totalResult.length == 0) {
        totalValue = 0;
      } else {
        totalValue = Object.values(totalResult[0])[0];
      }

      return { collectors, totalResult: totalValue };
    } catch (error) {
      throw error;
    }
  }

  static async getCollectors(req, res) {
    try {
      const { user } = req;
      const currentScope = user.locationScope;

      let {
        page = 1,
        resultsPerPage = 20,
        end,
        start,
        key,
        collectorType = "collector",
        assigned,
        enabled,
      } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);
      // if (assigned) assigned = assigned === "true" ? true : false;
      assigned = assigned ? (assigned === "true" ? true : false) : null;
      const status = enabled
        ? enabled === "true"
          ? "active"
          : "disable"
        : { $ne: "" };

      // if (!key) {
      //   if (!start || !end) {
      //     return res.status(400).json({
      //       error: true,
      //       message: "Please pass a start and end date",
      //     });
      //   }
      // }

      let criteria;
      if (key) {
        criteria = {
          $or: [
            { fullname: { $regex: `.*${key}.*`, $options: "i" } },
            { gender: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { email: { $regex: `.*${key}.*`, $options: "i" } },
            { localGovernment: { $regex: `.*${key}.*`, $options: "i" } },
            { organisation: { $regex: `.*${key}.*`, $options: "i" } },
            // { IDNumber: key },
          ],
          status,
        };
      } else if (start || end) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
        const [startDate, endDate] = [new Date(start), new Date(end)];
        endDate.setDate(endDate.getDate() + 1);
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          status,
        };
      } else {
        criteria = {};
      }

      criteria.collectorType = collectorType;
      if (assigned) criteria.organisation = { $ne: "" };
      else if (assigned === false) criteria.organisation = "";
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

      //console.log

      //if (state) criteria.state = state;

      const { collectors, totalResult } = await CollectorService.aggregateQuery(
        {
          criteria,
          page,
          resultsPerPage,
        }
      );

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          collectors,
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
      });
    }
  }

  static async searchCollectors(req, res) {
    let { state, page = 1, key, resultsPerPage = 20 } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = {
      verified: true,
      $or: [
        { fullname: { $regex: `.*${key}.*`, $options: "i" } },
        { gender: { $regex: `.*${key}.*`, $options: "i" } },
        { phone: { $regex: `.*${key}.*`, $options: "i" } },
        { email: { $regex: `.*${key}.*`, $options: "i" } },
        { localGovernment: { $regex: `.*${key}.*`, $options: "i" } },
        { organisation: { $regex: `.*${key}.*`, $options: "i" } },
        //{ IDNumber: { $regex: `.*${key}.*`, $options: "i" } },
      ],
    };
    if (state) criteria.state = state;

    try {
      // get length of collectors with completion status and provided field value
      // get collectors based on page
      const { collectors, totalResult } = await CollectorService.aggregateQuery(
        {
          criteria,
          page,
          resultsPerPage,
        }
      );

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        collectors,
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
  static async getCompanyCollectors(req, res) {
    const { _id: organisationId } = req.user;
    // log

    try {
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        state,
        key,
        collectorType = "collector",
        companyVerified,
      } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);
      companyVerified = companyVerified
        ? companyVerified === "true"
          ? true
          : false
        : { $exists: true };
      let criteria;

      if (key) {
        criteria = {
          $or: [
            { fullname: { $regex: `.*${key}.*`, $options: "i" } },
            { gender: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { email: { $regex: `.*${key}.*`, $options: "i" } },
            { localGovernment: { $regex: `.*${key}.*`, $options: "i" } },
            { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          ],
          organisationId: organisationId.toString(),
          companyVerified,
          collectorType,
          approvalStatus: { $ne: "DECLINED" },
        };
      } else if (start && end) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
        const [startDate, endDate] = [new Date(start), new Date(end)];
        endDate.setDate(endDate.getDate() + 1);
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          organisationId: organisationId.toString(),
          companyVerified,
          collectorType,
          approvalStatus: { $ne: "DECLINED" },
        };
      } else
        criteria = {
          organisationId: organisationId.toString(),
          companyVerified,
          collectorType,
          approvalStatus: { $ne: "DECLINED" },
        };
      if (state) criteria.state = state;

      console.log("criteria", criteria);

      //criteria.collectorType = collectorType;

      // const totalResult = await collectorModel.countDocuments(criteria);
      // const projection = {
      //   roles: 0,
      //   password: 0,
      // };
      // // get collectors based on page
      // const collectors = await collectorModel
      //   .find(criteria, projection, { lean: true })
      //   .sort({ createdAt: -1 })
      //   .skip((page - 1) * resultsPerPage)
      //   .limit(resultsPerPage);

      const { collectors, totalResult } = await CollectorService.aggregateQuery(
        {
          criteria,
          page,
          resultsPerPage,
        }
      );

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          collectors,
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
      });
    }
  }

  static async getGeoFencedCoordinates(req, res) {
    const { _id: organisationId } = req.user;
    const { collectorType = "collector" } = req.query;
    let { paginated = false, page = 1, resultsPerPage = 20 } = req.query;

    // handle query param values conversion
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);
    if (paginated) paginated = paginated === "true" ? true : false;

    console.log("organisationId", organisationId.toString());
    try {
      // check existence of geofence data in db
      const coordinateData = await geofenceModel.findOne({
        organisationId: organisationId.toString(),
      });
      // return error if data doesn't exist for company
      if (!coordinateData)
        return res.status(400).json({
          error: true,
          message: "Geo fence coordinates not found for organisation",
        });

      // handle pagination
      if (paginated) {
        // total results
        const totalResult = await await geofenceModel.countDocuments({
          organisationId,
        });
        // paginated result
        const coordinateData = await geofenceModel
          .find({
            organisationId: organisationId.toString(),
          })
          .sort({ createdAt: -1 })
          .skip((page - 1) * resultsPerPage)
          .limit(resultsPerPage);

        // send paginated data
        return res.status(200).json({
          error: false,
          message: "success",
          data: {
            coordinateData,
            totalResult,
            page,
            resultsPerPage,
            totalPages: Math.ceil(totalResult / resultsPerPage),
          },
        });
      } else {
        //send all coordinates
        const coordinateData = await geofenceModel.find({
          organisationId: organisationId.toString(),
        });

        // send all data
        return res.status(200).json({
          error: false,
          message: "success",
          data: coordinateData,
        });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true });
    }
  }

  static async getOrganisationPendingSchedules(req, res) {
    const { _id: organisationId } = req.user;

    // set today from 12:00am
    const active_today = new Date();
    active_today.setHours(0);
    active_today.setMinutes(0);

    // a week time from today
    let nextWeek = new Date();
    nextWeek.setDate(new Date().getDate() + 7);

    // constructs criteria to find schedules
    const schedulesCriteria = {
      // pickUpDate: {
      //   $gte: active_today,
      //   $lt: nextWeek,
      // },
      expiryDuration: {
        $gt: active_today,
      },
      state: req.user.state || "Lagos",
      completionStatus: "pending",
      collectorStatus: "decline",
    };
    try {
      const company = await organisationModel.findById(organisationId);
      // company access area
      const accessArea = company.streetOfAccess;

      // initial schedules
      const initSchedules = await scheduleModel
        .find(schedulesCriteria)
        .sort({pickUpDate:1});

      // result schedules accumlation list
      let schedules = [];

      // for every area in company's access area, find schedules for which have
      // the schedule's lcd matches the current area or the current area is
      // included in the schedule's address
      // accessArea.forEach((area) => {
      //   const matchSchedules = initSchedules.filter(
      //     (schedule) =>
      //       schedule?.address?.toLowerCase().indexOf(area?.toLowerCase()) >
      //         -1 || schedule?.lcd === area
      //   );
      //   schedules = schedules.concat(matchSchedules);
      // });

      initSchedules.forEach((schedule) => {
        if (accessArea.includes(schedule.lcd)) {
          schedules.push(schedule);
        }
      });

      // remove duplicate schedules
      schedules = [...new Set(schedules)];

      // send response
      return res.status(200).json({
        error: false,
        message: "success",
        data: schedules,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }

  static async disableCollector(req, res) {
    try {
      const collectorId = req.params.collectorId;
      const collector = await collectorModel.findById(collectorId);
      if (!collector) {
        return res.status(400).json({
          error: true,
          msg: "Aggregator not found",
        });
      }

      if (collector.status === "disable") {
        return res.status(200).json({
          error: false,
          message: "Aggregator already disabled",
        });
      }

      await collectorModel.updateOne(
        { _id: collector._id },
        {
          status: "disable",
        }
      );

      return res.status(200).json({
        error: false,
        message: "Aggregator disabled successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
      });
    }
  }

  static async enableCollector(req, res) {
    try {
      const collectorId = req.params.collectorId;
      const collector = await collectorModel.findById(collectorId);
      if (!collector) {
        return res.status(400).json({
          error: true,
          msg: "Aggregator not found",
        });
      }

      if (collector.status === "active") {
        return res.status(200).json({
          error: false,
          message: "Aggregator already enabled",
        });
      }

      await collectorModel.updateOne(
        { _id: collector._id },
        {
          status: "active",
        }
      );

      return res.status(200).json({
        error: false,
        message: "Aggregator enabled successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
      });
    }
  }

  static async removeCollector(req, res) {
    try {
      const { collectorId } = req.params;
      const collector = await collectorModel.findById(collectorId);
      if (!collector) {
        return res.status(400).json({
          error: true,
          message: "Collector not found",
        });
      }

      const remove = await collectorModel.deleteOne({
        _id: collector._id,
      });

      console.log("deleted", remove);

      return res.status(200).json({
        error: false,
        message: "Collector deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async approveCollector(req, res) {
    const { collectorId } = req.body;
    const {
      _id: companyId,
      organsationId: organisationId,
      streetOfAccess: accessArea,
    } = req.user;
    const projection = { password: 0, _v: 0 };
    try {
      const collector = await collectorModel.findById(collectorId);

      if (collector.companyVerified === true)
        return res.status(200).json({
          error: false,
          message: "Collector already approved",
        });

      await collectorModel.updateOne(
        { _id: collectorId, organisationId: req.user._id.toString() },
        {
          companyVerified: true,
          approvedBy: companyId,
          //status: "active",
          //organisationId,
          areaOfAccess: req.user.streetOfAccess,
          approvalStatus: "APPROVED",
        },
        projection
      );

      return res.status(200).json({
        error: false,
        message: "Collector approved successfully!",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }
  static async declineCollector(req, res) {
    const { collectorId } = req.body;
    const projection = { password: 0, __v: 0 };
    const { companyName: organisation } = req.user;
    try {
      const collector = await collectorModel.findById(collectorId);

      if (!collector.organisation)
        return res.status(200).json({
          error: false,
          message: "Collector already declined",
        });

      await collectorModel.updateOne(
        { _id: collectorId, organisation },
        {
          companyVerified: false,
          approvedBy: null,
          areaOfAccess: [],
          approvalStatus: "DECLINED",
          organisation: "",
          organisationId: "",
        },
        projection
      );

      return res.status(200).json({
        error: false,
        message: "Collector declined successfully!",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json(error);
    }
  }

  static async register(req, res) {
    try {
      const onesignal_id = uuid.v1().toString();
      const body = req.body;
      const checkPhone = await collectorModel.findOne({
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
      // handle the collector already register so a verification token can be resent
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

        return res.status(200).json({
          error: false,
          message: "Collector created successfully",
          data: {
            pin_id: send.data.pinId,
            _id: checkPhone._id,
            verified: checkPhone.verified,
            countryCode: checkPhone.countryCode,
            status: checkPhone.status,
            areaOfAccess: checkPhone.areasOfAccess,
            approvedBy: checkPhone.approvedBy,
            totalCollected: checkPhone.totalCollected,
            numberOfTripsCompleted: checkPhone.numberOfTripsCompleted,
            fullname: checkPhone.fullname,
            email: checkPhone.email,
            phone: checkPhone.phone,
            address: checkPhone.address,
            gender: checkPhone.gender,
            localGovernment: checkPhone.localGovernment,
            organisation: checkPhone.organisation,
            profile_picture: checkPhone.organisation,
            long: checkPhone.long,
            lat: checkPhone.lat,
            terms_condition: checkPhone.terms_condition,
            token,
          },
        });
      }
      if (body.email) {
        const checkEmail = await collectorModel.findOne({
          email: body.email,
        });
        if (checkEmail) {
          return res.status(400).json({
            error: true,
            message: "Email already exist",
          });
        }
      }

      let organisationName;
      let organisationId;
      let areaOfAccess = [];
      if (body.organisation) {
        const org = await organisationModel.findOne({
          companyName: body.organisation.trim(),
        });
        if (!org) {
          return res.status(400).json({
            error: true,
            message: "Invalid organisation passed",
          });
        }
        organisationName = org.companyName;
        organisationId = org._id.toString();
        areaOfAccess = org.streetOfAccess;
      } else {
        organisationName = "";
        organsationId = "";
        areaOfAccess = [];
      }

      const create = await collectorModel.create({
        fullname: body.fullname,
        email: body.email || "",
        phone: body.phone,
        password: await encryptPassword(body.password),
        gender: body.gender.toLowerCase(),
        country: body.country || "",
        state: body.state || "",
        long: body.long || "",
        lat: body.lat || "",
        organisation: organisationName,
        organisationId: organisationId,
        aggregatorId: "",
        areaOfAccess,
        onesignal_id,
        dateOfBirth: body.dateOfBirth || "",
        terms_condition: body.terms_condition || false,
        lcd: body.lcd || "",
        address: body.address || "",
        status: "active",
        companyVerified: false,
      });
      const token = authToken(create);
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

      return res.status(200).json({
        error: false,
        message: "Collector created successfully",
        data: {
          _id: create._id,
          verified: create.verified,
          countryCode: create.countryCode,
          status: create.status,
          areaOfAccess: create.areaOfAccess,
          approvedBy: create.approvedBy,
          totalCollected: create.totalCollected,
          numberOfTripsCompleted: create.numberOfTripsCompleted,
          fullname: create.fullname,
          email: create.email,
          phone: create.phone,
          address: create.address,
          gender: create.gender,
          localGovernment: create.localGovernment,
          organisation: create.organisation,
          profile_picture: create.organisation,
          long: create.long,
          lat: create.lat,
          pin_id: send.data.pinId,
          terms_condition: create.terms_condition,
          aggregatorId: create.aggregatorId,
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

  static async getCompanyCollectorStats(req, res) {
    const { companyName: organisation } = req.user;
    const { collectorType = "collector" } = req.query;
    try {
      // count verified collectors
      console.log("userid", req.user._id);
      const verifiedCount = await collectorModel.countDocuments({
        //verified: true,
        organisationId: req.user._id.toString(),
        companyVerified: true,
        collectorType,
        status: { $ne: "deleted" },
      });

      // count male company collectors
      const maleCount = await collectorModel.countDocuments({
        gender: "male",
        organisationId: req.user._id.toString(),
        //verified: true,
        //companyVerified: true,
        collectorType,
        status: { $ne: "deleted" },
      });

      // count female company collectors
      const femaleCount = await collectorModel.countDocuments({
        gender: "female",
        organisationId: req.user._id.toString(),
        //verified: true,
        //companyVerified: true,
        collectorType,
        status: { $ne: "deleted" },
      });

      // count new company collectors withon 30 days
      const ONE_MONTH_AGO = new Date() - 1000 * 60 * 60 * 24 * 30;
      const newCollectorsCount = await collectorModel.countDocuments({
        verified: true,
        createdAt: {
          $gte: ONE_MONTH_AGO,
        },
        companyVerified: false,
        organisationId: req.user._id.toString(),
        //companyVerified: t,
        collectorType,
        status: { $ne: "deleted" },
      });

      // get all company collectors
      const collectors = await collectorModel.find({
        organisationId: req.user._id.toString(),
        //companyVerified: true,
        collectorType,
        status: { $ne: "deleted" },
      });

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          male: maleCount,
          female: femaleCount,
          verified: verifiedCount,
          newCollectors: newCollectorsCount,
          collectors,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async getCompanyWasteTransaction(req, res) {
    let { page = 1, resultsPerPage = 20, start, end, key, state } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (!key && (!start || !end))
      return res.status(400).json({
        error: true,
        message: "Please pass a start and end date or a search key",
      });

    let { _id: organisation } = req.user;
    organisation = organisation.toString();
    let criteria;

    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { aggregatorId: { $regex: `.*${key}.*`, $options: "i" } },
          { recycler: { $regex: `.*${key}.*`, $options: "i" } },
          { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisationID: organisation,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisationID: organisation,
      };
    }

    try {
      const totalResult = await transactionModel.countDocuments(criteria);

      // paginated outstanding payment
      const wasteTransactions = await transactionModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          wasteTransactions,
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
        message: "An error occured",
      });
    }
  }

  static async getCompanyWasteStats(req, res) {
    let { start, end, state } = req.query;
    let { _id: organisation } = req.user;
    organisation = organisation.toString();
    if (!start || !end) {
      return res.status(400).json({
        error: true,
        message: "Please pass a start and end date",
      });
    }

    let criteria = {
      createdAt: {
        $gte: new Date(start),
        $lt: new Date(end),
      },
      organisationID: organisation,
    };
    const pipelines = [
      {
        $match: criteria,
      },
      {
        $unwind: {
          path: "$categories",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          category: {
            $ifNull: ["$categories.name", "$Category"],
          },
          month: {
            $month: "$createdAt",
          },
          createdAt: 1,
          weight: {
            $ifNull: ["$categories.quantity", "$weight"],
          },
        },
      },
      {
        $group: {
          _id: {
            month: "$month",
            category: "$category",
          },
          categoryCount: {
            $sum: 1,
          },
          totalWeight: {
            $sum: { $toInt: "$weight" },
          },
        },
      },
      {
        $project: {
          group: "$_id",
          categoryCount: 1,
          totalWeight: 1,
          _id: 0,
        },
      },
      {
        $group: {
          _id: "$group.month",
          items: {
            $push: {
              cat: "$group.category",
              count: "$categoryCount",
              weight: "$totalWeight",
            },
          },
        },
      },
      {
        $project: {
          month: "$_id",
          items: 1,
          _id: 0,
        },
      },
      {
        $sort: {
          month: 1,
        },
      },
    ];
    try {
      const wasteStats = await transactionModel.aggregate(pipelines);
      return res.status(200).json({
        error: false,
        message: "Success",
        data: { wasteStats, start, end },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async getCollectorPickups(req, res) {
    let {
      page = 1,
      resultsPerPage = 20,
      completionStatus = { $ne: "" },
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // construct criteria to find
    const { _id: collectedBy } = req.user;
    const criteria = { collectedBy, completionStatus };

    try {
      // count collector's pickups
      const totalResult = await scheduleModel.countDocuments(criteria);

      // pickups related to collector
      const pickups = await scheduleModel.find(criteria);

      // send response
      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          pickups,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true, message: "An error occured" });
    }
  }

  static async getCompanyDropOffLocations(req, res) {
    let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    let criteria;
    const { _id } = req.user;
    const organisationId = _id.toString();

    if (key) {
      criteria = {
        $or: [
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { "location.address": { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisationId,
      };
    } else if (start && end) {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisationId,
      };
    } else criteria = { organisationId };
    if (state) criteria.state = state;

    try {
      const totalResult = await dropOffModel.countDocuments(criteria);
      const projection = {
        roles: 0,
        password: 0,
      };
      // get locations based on page
      const locations = await dropOffModel
        .find(criteria, projection, { lean: true })
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          locations,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true, message: "An error occured" });
    }
  }

  static async verifyOTP(req, res) {
    const phone = req.body.phone;
    const token = req.body.token;
    const pin_id = req.body.pin_id;

    console.log("phone", phone);

    const user = await collectorModel.findOne({
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

      if (send.data.verified === true) {
        await collectorModel.updateOne({ phone }, { verified: true });

        const token = authToken(user);
        return res.status(200).json({
          error: false,
          message: "Token verified successfully",
          data: {
            _id: user._id,
            fullname: user.fullname,
            profile_picture: user.profile_picture,
            phone: user.phone,
            email: user.email || "",
            gender: user.gender,
            country: user.country,
            state: user.state,
            verified: true,
            long: user.long,
            lat: user.lat,
            status: user.status,
            organisation: user.organisation,
            areaOfAccess: user.areaOfAccess,
            totalCollected: user.totalCollected,
            numberOfTripsCompleted: user.numberOfTripsCompleted,
            token,
          },
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
      //const onesignal_id = uuid.v1();
      const collector = await collectorModel.findOne({
        phone: req.body.phone,
      });
      if (!collector) {
        return res.status(400).json({
          error: true,
          message: "Incorrect phone number or password",
          statusCode: 400,
        });
      }

      if (collector.status == "deleted") {
        return res.status(400).json({
          error: true,
          message: "Incorrect phone number or password",
          statusCode: 400,
        });
      }

      if (collector.isDisabled) {
        return res.status(400).json({
          error: true,
          message: "Account disabled,Contact support team",
          statusCode: 400,
        });
      }
      if (!(await comparePassword(req.body.password, collector.password))) {
        return res.status(400).json({
          error: true,
          message: "Incorrect phone number or password",
          statusCode: 400,
        });
      }

      // res
      if (!collector.terms_condition || collector.terms_condition == false) {
        return res.status(200).json({
          error: true,
          message: "Please accept terms and condition",
          data: { collectorId: collector._id },
          statusCode: 402,
        });
      }

      if (!collector.verified) {
        const phoneNo = String(collector.phone).substring(1, 11);
        const token = authToken(collector);
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
            _id: collector._id,
            verified: collector.verified,
            countryCode: collector.countryCode,
            dateOfBirth: collector.dateOfBirth,
            status: collector.status,
            areaOfAccess: collector.areasOfAccess,
            approvedBy: collector.approvedBy,
            totalCollected: collector.totalCollected,
            numberOfTripsCompleted: collector.numberOfTripsCompleted,
            fullname: collector.fullname,
            email: collector.email,
            phone: collector.phone,
            address: collector.address,
            account: collector.account,
            gender: collector.gender,
            localGovernment: collector.localGovernment,
            organisation: collector.organisation,
            profile_picture: collector.profile_picture,
            pin_id: send.data.pinId,
            token,
            aggregatorId: collector.aggregatorId || "",
          },
        });
      }

      let signal_id;
      if (!collector.onesignal_id || collector.onesignal_id === "") {
        signal_id = uuid.v1().toString();
      } else {
        signal_id = collector.onesignal_id;
      }

      const token = authToken(collector);

      if (collector.collectorType === "waste-picker") {
        if (collector.firstLogin) {
          return res.status(200).json({
            error: false,
            message: "Please change current password",
            data: {
              _id: collector._id,
              verified: collector.verified,
              countryCode: collector.countryCode,
              collectorType: collector.collectorType,
              status: collector.status,
              areaOfAccess: collector.areasOfAccess,
              approvedBy: collector.approvedBy,
              totalCollected: collector.totalCollected,
              numberOfTripsCompleted: collector.numberOfTripsCompleted,
              fullname: collector.fullname,
              email: collector.email,
              dateOfBirth: collector.dateOfBirth,
              phone: collector.phone,
              account: collector.account,
              address: collector.address,
              onesignal_id: signal_id,
              gender: collector.gender,
              localGovernment: collector.localGovernment,
              organisation: collector.organisation,
              profile_picture: collector.profile_picture,
              token,
              aggregatorId: collector.aggregatorId || "",
              firstLogin: collector.firstLogin,
              terms_condition: collector.terms_condition,
            },
          });
        }
      }

      await collectorModel.updateOne(
        { _id: collector._id },
        { last_logged_in: new Date(), onesignal_id: signal_id }
      );

      return res.status(200).json({
        error: false,
        message: "Collector login successfull",
        statusCode: 200,
        data: {
          _id: collector._id,
          verified: collector.verified,
          collectorType: collector.collectorType,
          countryCode: collector.countryCode,
          status: collector.status,
          areaOfAccess: collector.areasOfAccess,
          approvedBy: collector.approvedBy,
          totalCollected: collector.totalCollected,
          numberOfTripsCompleted: collector.numberOfTripsCompleted,
          fullname: collector.fullname,
          email: collector.email,
          dateOfBirth: collector.dateOfBirth,
          phone: collector.phone,
          account: collector.account,
          address: collector.address,
          onesignal_id: signal_id,
          gender: collector.gender,
          localGovernment: collector.localGovernment,
          organisation: collector.organisation,
          profile_picture: collector.profile_picture,
          aggregatorId: collector.aggregatorId || "",
          terms_condition: collector.terms_condition,
          firstLogin: collector.firstLogin,
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

  static async recentTransaction(req, res) {
    try {
      let { page = 1, resultsPerPage = 10, start, end, state, key } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      const collectorId = req.user._id;
      const totalResult = await transactionModel.countDocuments({
        completedBy: collectorId,
      });
      const t = await transactionModel.find({
        completedBy: collectorId,
      });
      const totalWaste = t
        .map((waste) => waste.weight)
        .reduce((a, b) => {
          return a + b;
        }, 0);

      const condition = { completedBy: collectorId.toString() };
      const skip = (page - 1) * resultsPerPage;

      console.log(condition);
      const transactions = await transactionModel.aggregate([
        {
          $match: condition,
        },
        {
          $addFields: { scheduleId: { $toObjectId: "$scheduleId" } },
        },
        {
          $lookup: {
            from: "schedulepicks",
            localField: "scheduleId",
            foreignField: "_id",
            as: "pickups",
          },
        },
        {
          $lookup: {
            from: "scheduledrops",
            localField: "scheduleId",
            foreignField: "_id",
            as: "drops",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        {
          $limit: resultsPerPage,
        },
        {
          $skip: skip,
        },
      ]);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          totalWaste: Math.ceil(totalWaste),
          totalAmount: req.user.pointGained,
          transactions,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true, message: "An error occured" });
    }
  }

  static async updateCollector(req, res) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      let { user } = req;

      let organisation = user.organisation || "";
      let organisationId = user.organisationId || "";
      if (req.body.organisation) {
        organisation = req.body.organisation;
        const org = await organisationModel.findOne({
          companyName: organisation,
        });

        if (!org) {
          return res.status(400).json({
            error: true,
            message: "Invalid organisation passed",
          });
        }
        organisationId = org._id.toString();
      }

      let email;

      if (req.body.email) {
        email = req.body.email.trim().toLowerCase();
      } else {
        email = user.email.trim().toLowerCase();
      }

      let fullname;
      if (req.body.fullname) {
        fullname = req.body.fullname.trim().toLowerCase();
      } else {
        fullname = user.fullname.trim().toLowerCase();
      }

      console.log("body", req.body);
      await collectorModel.updateOne(
        { _id: user._id },
        {
          $set: {
            email,
            phone: user.phone,
            gender: req.body.gender.toLowerCase() || user.gender,
            dateOfBirth: req.body.dateOfBirth || user.dateOfBirth,
            address: req.body.address || user.address,
            fullname,
            country: req.body.country || user.country,
            state: req.body.state || user.state,
            place: req.body.place || user.place,
            aggregatorId: req.body.aggregatorId || user.aggregatorId,
            organisation: req.body.organisation || user.organisation,
            organisationId: organisationId,
            localGovernment: req.body.localGovernment || user.localGovernment,
            profile_picture: req.body.profile_picture || user.profile_picture,
            areaOfAccess:
              organisation.streetOfAccess || user.areaOfAccess || [],
          },
        }
      );

      // user.gender = req.body.gender || user.gender;
      // user.address = req.body.address || user.address;
      // user.fullname = req.body.fullname || user.fullname;
      // user.state = req.body.state || user.state;
      // user.country = req.body.country || user.country;
      // user.place = req.body.place || user.place;
      // user.aggregatorId = req.body.aggregatorId || user.aggregatorId;
      // user.organisation = req.body.organisation || user.organisation;
      // user.localGovernment = req.body.localGovernment || user.localGovernment;
      // user.profile_picture = req.body.profile_picture || user.profile_picture;
      // user.areaOfAccess = organisation.areaOfAccess || user.areaOfAccess || [];
      //user.token = token;
      const newUser = {
        _id: user._id,
        fullname: req.body.fullname || user.fullname,
        address: req.body.address || user.address,
        place: req.body.place || user.place,
        email: user.email,
        phone: user.phone,
        dateOfBirth: req.body.dateOfBirth || user.dateOfBirth,
        roles: user.roles,
        busy: user.busy,
        createdAt: user.createdAt,
        countryCode: user.countryCode,
        verified: user.verified,
        status: user.status,
        gender: req.body.gender || user.gender,
        dateOfBirth: req.body.dateOfBirth || user.dateOfBirth,
        organisation: req.body.organisation || user.organisation,
        organisationId: user.organisationId,
        status: req.body.address || user.address,
        state: req.body.state || user.state,
        country: req.body.country || user.country,
        aggregatorId: req.body.aggregatorId || user.aggregatorId,
        localGovernment: req.body.localGovernment || user.localGovernment,
        areaOfAccess: organisation.areaOfAccess || user.areaOfAccess || [],
        approvedBy: user.approvedBy,
        totalCollected: user.totalCollected,
        numberOfTripsCompleted: user.numberOfTripsCompleted,
        lat: user.lat,
        long: user.long,
        onesignal_id: user.onesignal_id,
        profile_picture: req.body.profile_picture || user.profile_picture,
        token,
      };
      return res.status(200).json(newUser);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true, message: "An error occured" });
    }
  }

  // script assign organisatioId to all collectors
  static async assignOrganisationId(req, res) {
    try {
      const allCollectors = await collectorModel.find({
        $or: [{ organisation: { $ne: null } }, { organisation: "" }],
      });

      if (allCollectors.length > 0) {
        await Promise.all(
          allCollectors.map(async (collector) => {
            if (collector.organisation) {
              const collectOrg = await organisationModel.findOne({
                companyName: collector.organisation,
              });
              if (collectOrg) {
                await collectorModel.updateOne(
                  { _id: collector._id },
                  {
                    $set: {
                      organisationId: collectOrg._id.toString(),
                    },
                  }
                );
              }
            }
          })
        );
      }

      return res.status(200).json({ message: "Done" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: true, message: "An error occured" });
    }
  }

  static async registerPicker(req, res) {
    try {
      const onesignal_id = uuid.v1().toString();
      const body = req.body;
      const checkPhone = await collectorModel.findOne({
        phone: body.phone,
      });
      if (checkPhone) {
        return res.status(400).json({
          error: true,
          message: "Phone number already exist",
        });
      }

      let email;
      if (body.email) {
        const checkEmail = await collectorModel.findOne({
          email: body.email,
        });
        if (checkEmail) {
          return res.status(400).json({
            error: true,
            message: "Email already in use",
          });
        }
        email = body.email;
      } else {
        console.log("here");
        email =
          body.fullname.split(" ").join("") +
          Math.floor(Math.random() + 100) +
          "@xrubicon.com";
      }

      let organisationName = "";
      let organisationId = "";
      let areaOfAccess = [];

      if (body.organisation) {
        const org = await organisationModel.findById(body.organisation);
        if (!org) {
          return res.status(400).json({
            error: true,
            message: "Invalid organisation passed",
          });
        }

        if (org.allowPickers === false) {
          return res.status(400).json({
            error: true,
            message: "Organisation do not allow waste pickers",
          });
        }
        organisationName = org.companyName;
        organisationId = org._id.toString();
        areaOfAccess = org.streetOfAccess;
      }

      console.log("email", email);

      let password = generateRandomString();
      const hashpassword = await encryptPassword(password);
      const aggregatorId = generateRandomString();

      await passwordsModel.create({
        user: req.body.phone,
        password,
      });
      const create = await collectorModel.create({
        fullname: body.fullname,
        email,
        verified: true,
        phone: body.phone,
        password: hashpassword,
        gender: body.gender.toLowerCase(),
        country: body.country,
        state: body.state,
        organisation: organisationName,
        organisationId: organisationId,
        dateOfBirth: body.dateOfBirth || "",
        areaOfAccess,
        "account.accountName": body.accountName || "",
        "account.accountNo": body.accountNo || "",
        "account.bankName": body.bankName || "",
        "account.bankSortCode": body.sortCode || "",
        collectorType: "waste-picker",
        address: body.address,
        onesignal_id,
        aggregatorId: body.aggregatorId || "",
        firstLogin: true,
      });

      const phoneNo = String(create.phone).substring(1, 11);
      const msg = {
        api_key:
          "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
        type: "plain",
        to: `+234${phoneNo}`,
        from: "N-Alert",
        channel: "dnd",
        sms: `Welcome to pakam, Your Password is ${password}`,
      };
      const url = "https://api.ng.termii.com/api/sms/send";

      const sendSMS = await axios.post(url, JSON.stringify(msg), {
        headers: {
          "Content-Type": ["application/json", "application/json"],
        },
      });

      console.log("sms sent", sendSMS);

      return res.status(200).json({
        error: false,
        message: "Waste Picker created successfully",
        data: {
          _id: create._id,
          verified: create.verified,
          countryCode: create.countryCode,
          status: create.status,
          areaOfAccess: create.areaOfAccess,
          approvedBy: create.approvedBy,
          totalCollected: create.totalCollected,
          numberOfTripsCompleted: create.numberOfTripsCompleted,
          fullname: create.fullname,
          email: create.email,
          phone: create.phone,
          address: create.address,
          organisation: create.organisation,
          aggregatorId: create.aggregatorId,
          firstLogin: true,
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

  // assign waste pickers to organisation
  static async assignToOrganiation(req, res) {
    try {
      const body = req.body;
      const organisation = await organisationModel.findById(
        body.organisationId
      );
      if (!organisation) {
        return res.status(400).json({
          error: true,
          message: "Organisation not found",
        });
      }
      const picker = await collectorModel.findById(body.pickerId);
      if (!picker) {
        return res.status(400).json({
          error: true,
          message: "Waster picker not found",
        });
      }

      if (organisation.allowPickers === false) {
        return res.status(400).json({
          error: true,
          message: "Organisation do not allow waste pickers",
        });
      }

      if (picker.organisation !== "") {
        return res.status(400).json({
          error: true,
          message: "Waster picker already assigned to an organisation",
        });
      }

      const update = await collectorModel.updateOne(
        { _id: picker._id },
        {
          organisation: organisation.companyName,
          organisationId: organisation._id.toString(),
          approvedBy: null,
          approvalStatus: "PENDING",
          companyVerified: false,
        }
      );

      console.log("assigned", update);

      return res.status(200).json({
        error: false,
        message: "Waste Picker assigned successfully",
        data: {
          _id: picker._id,
          verified: picker.verified,
          countryCode: picker.countryCode,
          status: picker.status,
          areaOfAccess: picker.areaOfAccess,
          approvedBy: picker.approvedBy,
          totalCollected: picker.totalCollected,
          numberOfTripsCompleted: picker.numberOfTripsCompleted,
          fullname: picker.fullname,
          email: picker.email,
          phone: picker.phone,
          address: picker.address,
          organisation: organisation.companyName,
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

  // unassign waste pickers to organisation
  static async unassignFromOrganisation(req, res) {
    try {
      const { pickerId } = req.body;
      const picker = await collectorModel.findById(pickerId);
      if (!picker) {
        return res.status(400).json({
          error: true,
          message: "Waster picker not found",
        });
      }

      if (picker.organisation === "") {
        return res.status(400).json({
          error: true,
          message: "Waster picker not yet assigned to an organisation",
        });
      }

      const update = await collectorModel.updateOne(
        { _id: picker._id },
        {
          organisation: "",
          organisationId: "",
          approvedBy: null,
          approvalStatus: "PENDING",
          companyVerified: false,
          status: "disabled",
        }
      );

      console.log("assigned", update);

      return res.status(200).json({
        error: false,
        message: "Waste Picker unassigned successfully",
        data: {
          _id: picker._id,
          verified: picker.verified,
          countryCode: picker.countryCode,
          status: picker.status,
          areaOfAccess: picker.areaOfAccess,
          approvedBy: picker.approvedBy,
          totalCollected: picker.totalCollected,
          numberOfTripsCompleted: picker.numberOfTripsCompleted,
          fullname: picker.fullname,
          email: picker.email,
          phone: picker.phone,
          address: picker.address,
          organisation: "",
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

  // change password
  static async changePassword(req, res) {
    try {
      const user = await collectorModel.findOne({
        phone: req.body.phone.trim(),
      });

      if (!user) {
        return res.status(400).json({
          error: true,
          message: "Invalid phone passed",
        });
      }

      if (!(await comparePassword(req.body.oldPassword, user.password))) {
        return res.status(400).json({
          error: true,
          message: "incorrect old password",
          statusCode: 400,
        });
      }

      if (req.body.newPassword.trim() !== req.body.confirmPassword.trim()) {
        return res.status(400).json({
          error: true,
          message: "confirm password does not match new password",
        });
      }

      const newPassword = await encryptPassword(req.body.newPassword);

      const update = await collectorModel.updateOne(
        { _id: user._id },
        {
          password: newPassword,
          firstLogin: false,
        }
      );

      console.log("update", update);

      return res.status(200).json({
        error: false,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  // get collector current point balance
  static async collectorPointBalance(req, res) {
    try {
      const { user } = req;
      const collector = await collectorModel.findById(user._id);

      if (!collector) {
        return res.status(400).json({
          error: true,
          message: "Invalid collector, please contact support team",
        });
      }
      let ledgerBalance = collector.ledgerPoints
        .map((x) => x.point)
        .reduce((acc, curr) => acc + curr, 0);

      console.log(ledgerBalance);
      if (ledgerBalance == null) {
        ledgerBalance = 0;
      }
      return res.status(200).json({
        error: false,
        message: "Point Balance",
        data: { balance: collector.pointGained, ledgerBalance },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async acceptTermsCondition(req, res) {
    try {
      const { collectorId } = req.body;
      const collector = await collectorModel.findOne({ _id: collectorId });
      if (!collector) {
        return res.status(400).json({
          error: true,
          message: "collector not found",
        });
      }
      await collectorModel.updateOne(
        { _id: collector._id },
        {
          terms_condition: true,
        }
      );

      // if (!accept) {
      //   return res.status(400).json({
      //     error: true,
      //     message: "Invaild collector details passed",
      //   });
      // }

      const token = authToken(collector);

      return res.status(200).json({
        error: false,
        message: "Terms and condition accepted successfully",
        data: {
          _id: collector._id,
          verified: collector.verified,
          collectorType: collector.collectorType,
          countryCode: collector.countryCode,
          status: collector.status,
          areaOfAccess: collector.areasOfAccess,
          approvedBy: collector.approvedBy,
          totalCollected: collector.totalCollected,
          numberOfTripsCompleted: collector.numberOfTripsCompleted,
          fullname: collector.fullname,
          email: collector.email,
          dateOfBirth: collector.dateOfBirth,
          phone: collector.phone,
          address: collector.address,
          onesignal_id: collector.signal_id,
          gender: collector.gender,
          localGovernment: collector.localGovernment,
          organisation: collector.organisation,
          profile_picture: collector.profile_picture,
          aggregatorId: collector.aggregatorId || "",
          terms_condition: true,
          firstLogin: collector.firstLogin,
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

  // request summary page
  // request otp
  // confirm otp and initate payment

  static async requestSummary(req, res) {
    try {
      const { user } = req;
      const body = {
        collectorId: user._id,
      };

      const result = await axios.post(
        "https://apiv2.pakam.ng./api/wastepicker/withdrawal/summary",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      return res.status(200).json(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async b(req, res) {
    try {
      const { user } = req;
      const body = {
        collectorId: user._id,
      };
      const result = await axios.post(
        "https://apiv2.pakam.ng./api/wastepicker/request/otp",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      console.log("here", result.data);
      return res.status(200).json(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async initiatePayment(req, res) {
    try {
      const { user } = req;
      const body = {
        collectorId: user._id,
        requestId: req.body.requestId,
        otp: req.body.otp,
      };

      const result = await axios.post(
        "https://apiv2.pakam.ng./api/disbursement/collector/initiate",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      console.log("here", result.data);
      return res.status(200).json(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async requestOTP(req, res) {
    try {
      const { user } = req;
      const body = {
        collectorId: user._id,
        type: "gain",
      };

      const result = await axios.post(
        "https://apiv2.pakam.ng./api/wastepicker/request/otp",
        body,
        {
          headers: {
            Accept: "application/json",
            "Accept-Charset": "utf-8",
          },
        }
      );

      return res.status(200).json(result.data);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async removeUser(req, res) {
    try {
      const { user } = req;
      // const result = await await collectorModel.findById(user._id, {
      //   status: "deleted",
      // });

      // if (!result) {
      //   return res.status(400).json({
      //     error: true,
      //     message: "User not found",
      //   });
      // }

      const newResult = { ...user.toJSON() };

      delete newResult._id;
      console.log("newResult", newResult);

      const storeInBin = await collectorBinModel.create(newResult);
      if (storeInBin) {
        console.log("here");
        await collectorModel.deleteOne({ phone: user.phone });
      }

      return res.status(200).json({
        error: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "Error removing User",
      });
    }
  }

  static async saveWasteBancAgent(req, res) {
    const agentData = req.body;
    const { email, phone } = agentData;

    try {
      // find agent with the supplied email and phoneNo
      let agent = await wastebancAgentModel.findOne({
        email,
        phone,
      });

      // return error if already exist
      if (agent)
        return res.send(400).json({
          error: true,
          message: "Agent with email or phone number already exist!",
        });

      await wastebancAgentModel.create(agentData);
      return res.status(201).json({
        error: false,
        message: "Agent data saved successfully!",
      });
    } catch (error) {
      res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }
}

module.exports = CollectorService;
