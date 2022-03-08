const { collectorModel } = require("../models");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

class CollectorService {
  static async getCollectors(req, res) {
    let { page = 1, resultsPerPage = 20, start, end, state } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const [startDate, endDate] = [new Date(start), new Date(end)];
    const criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      verified: true,
    };
    if (state) criteria.state = state;

    try {
      // get length of collectors within given date range
      const totalResult = await collectorModel.countDocuments(criteria);

      // get all collectors meeting all criteria
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
}

module.exports = CollectorService;
