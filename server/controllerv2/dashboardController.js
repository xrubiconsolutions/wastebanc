const {
  scheduleModel,
  scheduleDropModel,
  transactionModel,
  userModel,
  collectorModel,
} = require("../models");

const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
let dashboardController = {};

const { validationResult, body } = require("express-validator");

const bodyValidate = (req, res) => {
  // 1. Validate the request coming in
  // console.log(req.body);
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
};

dashboardController.cardMapData = async (req, res) => {
  bodyValidate(req, res);

  try {
    const { start, end, state } = req.query;
    const [startDate, endDate] = [new Date(start), new Date(end)];
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    const criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };
    if (state) criteria.state = state;

    const schedules = await allSchedules(criteria);
    const totalWastes = await totalWaste(criteria);
    const totalDropOff = await dropOffs(criteria);
    const totalMissed = await missed(criteria);
    const totalCompleted = await completed(criteria);
    const totalPending = await pending(criteria);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        schedules,
        totalPending,
        totalMissed,
        totalPending,
        totalCompleted,
        totalDropOff,
        totalWastes,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dashboardController.recentPickups = async (req, res) => {
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
          { Category: key },
          { organisation: key },
          { schuduleCreator: key },
          { collectorStatus: key },
          { client: key },
          { phone: key },
          { completionStatus: key },
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

    const totalResult = await scheduleModel.countDocuments(criteria);

    // get schedules based on page
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
};

dashboardController.newUsers = async (req, res) => {
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
          { username: key },
          { cardID: key },
          { fullName: key },
          { gender: key },
          { phone: key },
          { email: key },
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

    const projection = {
      roles: 0,
      password: 0,
    };

    const users = await userModel
      .find(criteria, projection, { lean: true })
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
};

dashboardController.newAggregators = async (req, res) => {
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
      message: "An error occurred",
    });
  }
};

const allSchedules = async (criteria) => {
  // get length of schedules within given date range
  const schedules = await scheduleModel.find(criteria).sort({ createdAt: -1 });
  return schedules;
};

const completed = async (criteria) => {
  criteria.completionStatus = "completed";
  const totalCompleted = await scheduleModel.countDocuments(criteria);
  return totalCompleted;
};

const missed = async (criteria) => {
  criteria.completionStatus = "missed";
  const totalMissed = await scheduleModel.countDocuments(criteria);
  return totalMissed;
};

const pending = async (criteria) => {
  //pending
  criteria.completionStatus = "pending";
  const totalPending = await scheduleModel.countDocuments(criteria);
  return totalPending;
};

const dropOffs = async (criteria) => {
  const totalResult = await scheduleDropModel.countDocuments(criteria);
  return totalResult;
};

const totalWaste = async (criteria) => {
  const transactions = await transactionModel.find(criteria);

  const totalWastes = transactions
    .map((x) => x.weight)
    .reduce((acc, curr) => acc + curr, 0);

  return totalWastes;
};
module.exports = dashboardController;
