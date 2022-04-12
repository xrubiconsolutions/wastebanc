const {
  scheduleModel,
  scheduleDropModel,
  transactionModel,
  userModel,
  collectorModel,
  categoryModel,
} = require("../models");

const { sendResponse } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
let dashboardController = {};

const { validationResult, body } = require("express-validator");
const { Model } = require("mongoose");

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
  const { states } = req.user;

  try {
    const { start, end, state } = req.query;
    const [startDate, endDate] = [new Date(start), new Date(end)];
    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    if (state) criteria.state = state;

    const schedules = await allSchedules(criteria);
    const totalWastes = await totalWaste(criteria);
    const totalPayment = await totalpayout(criteria);
    const totalOutstanding = await totaloutstanding(criteria);
    const totalDropOff = await dropOffs(criteria);
    const totalMissed = await missed(criteria);
    const totalCompleted = await completed(criteria);
    const totalPending = await pending(criteria);
    const totalCancelled = await cancelled(criteria);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        schedules,
        totalSchedules: schedules.length,
        totalPending,
        totalMissed,
        totalCompleted,
        totalCancelled,
        totalDropOff,
        totalWastes: Math.ceil(totalWastes),
        totalPayment: Math.ceil(totalPayment),
        totalOutstanding: Math.ceil(totalOutstanding),
      },
    });
  } catch (error) {
    // console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dashboardController.companyCardMapData = async (req, res) => {
  bodyValidate(req, res);

  try {
    const { start, end, state } = req.query;
    const [startDate, endDate] = [new Date(start), new Date(end)];
    const { companyName: organisation } = req.user;

    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      organisation,
    };

    const schedules = await allSchedules(criteria);
    const totalWastes = await totalWaste(criteria);
    const totalPayment = await totalpayout(criteria);
    const totalOutstanding = await totaloutstanding(criteria);
    const totalDropOff = await dropOffs(criteria);
    const totalMissed = await missed(criteria);
    const totalCompleted = await completed(criteria);
    const totalPending = await pending(criteria);
    const totalCancelled = await cancelled(criteria);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        schedules,
        totalPending,
        totalMissed,
        totalCompleted,
        totalCancelled,
        totalDropOff,
        totalWastes: Math.ceil(totalWastes),
        totalPayment: Math.ceil(totalPayment),
        totalOutstanding: Math.ceil(totalOutstanding),
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
    const { states } = req.user;

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          { schuduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
          { client: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        state: { $in: states },
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        state: { $in: states },
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
        totalPages: Math.ceil(totalResult / resultsPerPage),
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
    const { states } = req.user;

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { username: { $regex: `.*${key}.*`, $options: "i" } },
          { fullName: { $regex: `.*${key}.*`, $options: "i" } },
          { gender: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { email: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        roles: "client",
        state: { $in: states },
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createAt: {
          $gte: startDate,
          $lt: endDate,
        },
        roles: "client",
        state: { $in: states },
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
      //.populate("organisationType", "name")
      .sort({ createAt: -1 })
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
        totalPages: Math.ceil(totalResult / resultsPerPage),
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
    const { states } = req.user;

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
          // { IDNumber: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        state: { $in: states },
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        state: { $in: states },
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
      message: "An error occurred",
    });
  }
};

dashboardController.collectormapData = async (req, res) => {
  console.log("here");
  bodyValidate(req, res);
  try {
    const { start, end, state } = req.query;
    const [startDate, endDate] = [new Date(start), new Date(end)];
    const { states } = req.user;

    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      state: { $in: states },
    };

    const collectors = await allCollector(criteria);

    const totalVerified = await verified(criteria);
    const totalF = await totalFemale(criteria);
    const totalM = await totalMale(criteria);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        collectors,
        totalCollectors: collectors.length,
        totalFemale: totalF,
        totalMale: totalM,
        totalVerified,
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

dashboardController.chartData = async (req, res) => {
  try {
    let { start, end, state } = req.query;
    if (!start || !end) {
      return res.status(400).json({
        error: true,
        message: "Please pass a start and end date",
      });
    }
    const { states } = req.user;
    let criteria = {
      createdAt: {
        $gte: new Date(start),
        $lt: new Date(end),
      },
      state: { $in: states },
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

    const wasteStats = await transactionModel.aggregate(pipelines);
    return res.status(200).json({
      error: false,
      message: "Success",
      data: { wasteStats, start, end },
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
  const totalCompleted = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "completed",
  });
  return totalCompleted;
};

const missed = async (criteria) => {
  const totalMissed = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "missed",
  });
  return totalMissed;
};

const pending = async (criteria) => {
  const totalPending = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "pending",
  });
  return totalPending;
};

const cancelled = async (criteria) => {
  const totalCancelled = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "cancelled",
  });
  return totalCancelled;
};

const dropOffs = async (criteria) => {
  const totalResult = await scheduleDropModel.countDocuments(criteria);
  return totalResult;
};

const totalWaste = async (criteria) => {
  console.log("totalWaste", criteria);
  const transactions = await transactionModel.find(criteria);

  const totalWastes = transactions
    .map((x) => x.weight)
    .reduce((acc, curr) => acc + curr, 0);

  return totalWastes;
};

const totalpayout = async (criteria) => {
  const transactions = await transactionModel.find({
    ...criteria,
    paid: true,
    requestedForPayment: true,
  });
  const totalpayouts = transactions
    .map((x) => x.coin)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const totaloutstanding = async (criteria) => {
  const transactions = await transactionModel.find({
    ...criteria,
    paid: false,
    requestedForPayment: true,
  });
  const totalpayouts = transactions
    .map((x) => x.coin)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const totalMale = async (criteria) => {
  return await collectorModel.countDocuments({ ...criteria, gender: "male" });
};

const totalFemale = async (criteria) => {
  return await collectorModel.countDocuments({ ...criteria, gender: "female" });
};

const verified = async (criteria) => {
  return await collectorModel.countDocuments({ ...criteria, verified: true });
};

const allCollector = async (criteria) => {
  return await collectorModel.find(criteria);
};

module.exports = dashboardController;
