const { collectorModel } = require("../models");
const geofenceModel = require("../models/geofenceModel");
const organisationModel = require("../models/organisationModel");
const scheduleModel = require("../models/scheduleModel");
const transactionModel = require("../models/transactionModel");
const dropOffModel = require("../models/dropOffModel");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  authToken,
  comparePassword,
} = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const { validationResult, body } = require("express-validator");
const axios = require("axios");
const request = require("request");
const uuid = require("uuid");

class CollectorService {
  static async getCollectors(req, res) {
    try {
      const { user } = req;
      const currentScope = user.locationScope;

      let { page = 1, resultsPerPage = 20, end, start, key } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

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
        };
      } else if (start || end) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        };
      } else {
        criteria = {};
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

      const totalResult = await collectorModel.countDocuments(criteria);
      const projection = {
        roles: 0,
        password: 0,
      };
      // get collectors based on page
      const collectors = await collectorModel
        .find(criteria, projection, { lean: true })
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

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
      const totalResult = await collectorModel.countDocuments(criteria);

      // get collectors based on page
      const collectors = await collectorModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

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
    const { companyName: organisation } = req.user;
    // log
    try {
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        state,
        key,
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
          organisation,
          companyVerified,
        };
      } else if (start && end) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          organisation,
          companyVerified,
        };
      } else criteria = { organisation, companyVerified };
      if (state) criteria.state = state;

      const totalResult = await collectorModel.countDocuments(criteria);
      const projection = {
        roles: 0,
        password: 0,
      };
      // get collectors based on page
      const collectors = await collectorModel
        .find(criteria, projection, { lean: true })
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

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
    let { paginated = false, page = 1, resultsPerPage = 20 } = req.query;

    // handle query param values conversion
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);
    if (paginated) paginated = paginated === "true" ? true : false;

    try {
      // check existence of geofence data in db
      const coordinateData = await geofenceModel.findOne({
        organisationId,
      });
      // return error if data doesn't exist for company
      if (!coordinateData)
        return res.status(404).json({
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
            organisationId,
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
          organisationId,
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
      pickUpDate: {
        $gte: active_today,
        $lt: nextWeek,
      },
      completionStatus: "pending",
      collectorStatus: { $ne: "accept" },
    };
    try {
      const company = await organisationModel.findById(organisationId);
      // company access area
      const accessArea = company.streetOfAccess;

      // initial schedules
      const initSchedules = await scheduleModel.find(schedulesCriteria);

      // result schedules accumlation list
      let schedules = [];

      // for every area in company's access area, find schedules for which have
      // the schedule's lcd matches the current area or the current area is
      // included in the schedule's address
      accessArea.forEach((area) => {
        const matchSchedules = initSchedules.filter(
          (schedule) =>
            schedule.address.toLowerCase().indexOf(area.toLowerCase()) > -1 ||
            schedule.lcd === area
        );
        schedules = schedules.concat(matchSchedules);
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
          message: "Aggregator already enabled",
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

  static async approveCollector(req, res) {
    const { collectorId } = req.body;
    const { _id: companyId, companyName: organisation } = req.user;
    const projection = { password: 0, _v: 0 };
    try {
      const collector = await collectorModel.findById(collectorId);

      if (collector.companyVerified === true)
        return res.status(200).json({
          error: false,
          message: "Collector already approved",
        });

      await collectorModel.updateOne(
        { _id: collectorId, organisation },
        {
          companyVerified: true,
          approvedBy: companyId,
          status: "active",
          organisation: companyName,
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
          organisation: "",
          approvedBy: "",
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

      const create = await collectorModel.create({
        fullname: body.fullname,
        email: body.email || "",
        phone: body.phone,
        password: await encryptPassword(body.password),
        gender: body.gender,
        country: body.country,
        state: body.state,
        long: body.long || "",
        lat: body.lat || "",
        organisation: body.organisation || "",
        aggregatorId: "",
        onesignal_id,
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

      console.log("res", send.data);

      console.log("c", create);

      return res.status(200).json({
        error: false,
        message: "Collector created successfully",
        data: {
          _id: create._id,
          verified: create.verified,
          countryCode: create.countryCode,
          status: create.status,
          areaOfAccess: create.areasOfAccess,
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
          token,
          aggregatorId: create.aggregatorId,
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
    try {
      // count verified collectors
      const verifiedCount = await collectorModel.countDocuments({
        verified: true,
        organisation,
      });

      // count male company collectors
      const maleCount = await collectorModel.countDocuments({
        gender: "male",
        organisation,
        verified: true,
      });

      // count female company collectors
      const femaleCount = await collectorModel.countDocuments({
        gender: "female",
        organisation,
        verified: true,
      });

      // count new company collectors withon 30 days
      const ONE_MONTH_AGO = new Date() - 1000 * 60 * 60 * 24 * 30;
      const newCollectorsCount = await collectorModel.countDocuments({
        verified: true,
        createdAt: {
          $gte: ONE_MONTH_AGO,
        },
        organisation,
      });

      // get all company collectors
      const collectors = await collectorModel.find({
        organisation,
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

    let { _id: organisationID } = req.user;
    organisationID = organisationID.toString();
    let criteria;

    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { aggregatorId: { $regex: `.*${key}.*`, $options: "i" } },
          { recycler: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisationID,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisationID,
      };
    }

    try {
      // totalResult count
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
      organisation,
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
            $sum: "$weight",
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
          message: "Invalid credentials",
        });
      }

      if (!(await comparePassword(req.body.password, collector.password))) {
        return res.status(400).json({
          error: true,
          message: "Invalid email or password",
          statusCode: 400,
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
            status: collector.status,
            areaOfAccess: collector.areasOfAccess,
            approvedBy: collector.approvedBy,
            totalCollected: collector.totalCollected,
            numberOfTripsCompleted: collector.numberOfTripsCompleted,
            fullname: collector.fullname,
            email: collector.email,
            phone: collector.phone,
            address: collector.address,
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
      await collectorModel.updateOne(
        { _id: collector._id },
        { last_logged_in: new Date(), onesignal_id: signal_id }
      );
      const token = authToken(collector);
      return res.status(200).json({
        error: false,
        message: "Collector login successfull",
        statusCode: 200,
        data: {
          _id: collector._id,
          verified: collector.verified,
          countryCode: collector.countryCode,
          status: collector.status,
          areaOfAccess: collector.areasOfAccess,
          approvedBy: collector.approvedBy,
          totalCollected: collector.totalCollected,
          numberOfTripsCompleted: collector.numberOfTripsCompleted,
          fullname: collector.fullname,
          email: collector.email,
          phone: collector.phone,
          address: collector.address,
          onesignal_id: signal_id,
          gender: collector.gender,
          localGovernment: collector.localGovernment,
          organisation: collector.organisation,
          profile_picture: collector.profile_picture,
          token,
          aggregatorId: collector.aggregatorId || "",
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
      let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
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
}

module.exports = CollectorService;
