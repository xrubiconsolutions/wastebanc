const scheduleModel = require("../models/scheduleModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

class ScheduleService {
  static async getSchedulesWithFilter(req, res) {
    try {
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        state,
        key,
        completionStatus = { $ne: "" },
      } = req.query;
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
            { Category: key },
            { organisation: key },
            { schuduleCreator: key },
            { collectorStatus: key },
            { client: key },
            { phone: key },
            { completionStatus: key },
          ],
          completionStatus,
        };
      } else {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          completionStatus,
        };
      }
      if (state) criteria.state = state;

      const totalResult = await scheduleModel.countDocuments(criteria);

      // get all schedules within range
      const schedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          schedules,
          totalResult,
          page,
          resultsPerPage,
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

  static async searchSchedules(req, res) {
    let {
      state,
      page = 1,
      key,
      completionStatus = { $ne: "" },
      resultsPerPage = 20,
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = {
      $or: [
        { Category: key },
        { organisation: key },
        { collectorStatus: key },
        { client: key },
        { phone: key },
        { scheduleCreator: key },
      ],
      completionStatus,
    };
    if (state) criteria.state = state;

    try {
      // get length of schedules with completion status and provided field value
      const totalResult = await scheduleModel.countDocuments(criteria);

      // get schedules based on page
      const schedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        schedules,
        totalResult,
        page,
        resultsPerPage,
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }

  static async getCompanySchedules(req, res) {
    const { companyName: organisation } = req.user;
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      completionStatus = { $ne: "" },
      key,
    } = req.query;

    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // return error if neither date range nor search key is provided
    if (!key && (!start || !end))
      return sendResponse(res, {
        statusCode: 422,
        customMessage: "Supply a date range (start and end) or key to search",
      });

    const [startDate, endDate] = [new Date(start), new Date(end)];
    const criteria = key
      ? {
          $or: [
            { Category: key },
            { organisation: key },
            { collectorStatus: key },
            { client: key },
            { phone: key },
            { scheduleCreator: key },
          ],
          completionStatus,
          organisation,
        }
      : {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          organisation,
          completionStatus,
        };

    try {
      // get length of schedules with criteria
      const totalResult = await scheduleModel.countDocuments(criteria);

      const companySchedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        companySchedules,
        totalResult,
        page,
        resultsPerPage,
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }
}

module.exports = ScheduleService;
