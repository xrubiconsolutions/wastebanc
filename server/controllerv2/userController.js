const userModel = require("../models/userModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

class UserService {
  static async getClients(req, res) {
    let { page = 1, resultsPerPage = 20, start, end, state } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const [startDate, endDate] = [new Date(start), new Date(end)];
    const criteria = {
      createAt: {
        $gte: startDate,
        $lt: endDate,
      },
      roles: "client",
      verified: true,
    };
    if (state) criteria.state = state;

    try {
      // get length of users within given date range
      const totalResult = await userModel.countDocuments(criteria);

      // get all users meeting all criteria
      const users = await userModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        users,
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

module.exports = UserService;
