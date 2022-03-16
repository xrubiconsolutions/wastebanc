const { collectorModel } = require("../models");
const geofenceModel = require("../models/geofenceModel");
const organisationModel = require("../models/organisationModel");
const scheduleModel = require("../models/scheduleModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const { validationResult, body } = require("express-validator");

class CollectorService {
  static bodyValidate(req, res) {
    const result = validationResult(req);

    const hasErrors = !result.isEmpty();
    console.log(hasErrors);

    if (hasErrors) {
      //   debugLog('user body', req.body);
      // 2. Throw a 422 if the body is invalid
      return res.status(422).json({
        error: true,
        statusCode: 422,
        message: "Invalid body request",
        errors: result.array({ onlyFirstError: true }),
      });
    }
  }
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
        { fullname: key },
        { gender: key },
        { phone: key },
        { email: key },
        { localGovernment: key },
        { organisation: key },
        { IDNumber: key },
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
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
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
          data: { coordinateData, totalResult, page, resultsPerPage },
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
}

module.exports = CollectorService;
