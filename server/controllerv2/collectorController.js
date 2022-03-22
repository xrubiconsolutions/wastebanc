const { collectorModel } = require("../models");
const geofenceModel = require("../models/geofenceModel");
const organisationModel = require("../models/organisationModel");
const scheduleModel = require("../models/scheduleModel");
const transactionModel = require("../models/transactionModel");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  authToken,
} = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const { validationResult, body } = require("express-validator");

const request = require("request");

class CollectorService {
  static async getCollectors(req, res) {
    try {
      let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);

      if (!key) {
        if (!start || !end) {
          return res.status(400).json({
            error: true,
            message: "Please pass a start and end date",
          });
        }
      }

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
      } else {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        };
      }
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
    try {
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        state,
        key,
        verified,
      } = req.query;
      if (typeof page === "string") page = parseInt(page);
      if (typeof resultsPerPage === "string")
        resultsPerPage = parseInt(resultsPerPage);
      verified = verified
        ? verified === "true"
          ? true
          : false
        : { $exists: true };
      let criteria;

      if (key) {
        criteria = {
          $or: [
            { fullname: key },
            { gender: key },
            { phone: key },
            { email: key },
            { localGovernment: key },
            { organisation: key },
            { IDNumber: key },
          ],
          organisation,
          verified,
        };
      } else if (start && end) {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          organisation,
          verified,
        };
      } else criteria = { organisation, verified };
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

      if (!collector.status || collector.status === "active") {
        return res.status(200).json({
          error: false,
          message: "Aggregator already enabled",
        });
      }

      await collectorModel.updateOne(
        { _id: collector._id },
        {
          status: "disabled",
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

      if (collector.verified === true)
        return res.status(200).json({
          error: false,
          message: "Collector already approved",
        });

      await collectorModel.updateOne(
        { _id: collectorId, organisation },
        {
          verified: true,
          approvedBy: companyId,
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

      if (collector.verified === false)
        return res.status(200).json({
          error: false,
          message: "Collector already declined",
        });

      await collectorModel.updateOne(
        { _id: collectorId, organisation },
        {
          verified: false,
          organisation: "",
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
    bodyValidate(req, res);
    try {
      const body = req.body;
      const checkPhone = await collectorModel.findOne({
        phone: body.phone,
      });
      if (checkPhone) {
        return res.status(400).json({
          error: true,
          message: "Phone already exist",
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
        organisation: body.organisation,
      });
      const token = authToken(create);
      const phoneNo = String(create.phone).substring(1, 11);
      const data = {
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
        body: JSON.stringify(data),
      };

      request(options, function (error, response) {
        const iden = JSON.parse(response.body);
        if (error) {
          throw new Error(error);
        } else {
          // let UserData = {
          //   email: RESULT.email,
          //   phone: RESULT.phone,
          //   username: RESULT.username,
          //   roles: RESULT.roles,
          //   pin_id: iden.pinId,
          // };

          var data = {
            api_key:
              "TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
            phone_number: `+234${phoneNo}`,
            country_code: "NG",
          };
          var options = {
            method: "GET",
            url: " https://termii.com/api/insight/number/query",
            headers: {
              "Content-Type": ["application/json", "application/json"],
            },
            body: JSON.stringify(data),
          };
          request(options, function (error, response) {
            if (error) throw new Error(error);
            //var mobileData = JSON.parse(response.body);
            //var mobile_carrier = mobileData.result[0].operatorDetail.operatorName;
          });
        }
      });

      return res.status(200).json({
        error: false,
        message: "Collector created successfully",
        data: {
          _id: create._id,
          fullname: create.fullname,
          email: create._id,
          phone: create._id,
          gender: create.gender,
          country: create.country,
          state: create.state,
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
    try {
      // count verified collecctors
      const verifiedCount = await collectorModel.countDocuments({
        verified: true,
        organisation,
      });

      // count male company colelctors
      const maleCount = await collectorModel.countDocuments({
        gender: "male",
        organisation,
      });

      // count female company colelctors
      const femaleCount = await collectorModel.countDocuments({
        gender: "female",
        organisation,
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
      const collectors = await collectorModel.find({ organisation });

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

    const { _id: organisationID } = req.user;
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
    const { _id: organisation } = req.user;

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
}

module.exports = CollectorService;
