const userModel = require("../models/userModel");
const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");

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
        .sort({ createdAt: -1 })
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
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }
}

module.exports = UserService;
