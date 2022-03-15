const { collectorModel } = require("../models");
const geofenceModel = require("../models/geofenceModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

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
            { fullname: key },
            { gender: key },
            { phone: key },
            { email: key },
            { localGovernment: key },
            { organisation: key },
            { IDNumber: key },
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
      res.status(500).json({ error: true });
    }
  }
}

module.exports = CollectorService;
