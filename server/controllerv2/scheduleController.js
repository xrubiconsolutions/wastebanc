const scheduleModel = require("../models/scheduleModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

class ScheduleService {
  static async getSchedulesWithFilter(req, res) {
    let { page = 1, resultsPerPage = 20, start, end } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const [startDate, endDate] = [new Date(start), new Date(end)];
    console.log(new Date(start), new Date(end), new Date(start));

    try {
      // get length of schedules within given date range
      const totalResult = await scheduleModel.countDocuments({
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      });

      //   get all schedules within range
      const schedules = await scheduleModel
        .find({
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        })
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

  static async searchSchedules(req, res) {
    let {
      field,
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
        { schuduleCreator: key },
        { collectorStatus: key },
        { client: key },
        { phone: key },
      ],
      completionStatus,
    };

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
}

module.exports = ScheduleService;
