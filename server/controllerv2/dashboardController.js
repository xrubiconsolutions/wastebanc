const {
  scheduleModel,
  scheduleDropModel,
  transactionModel,
  userModel,
  collectorModel,
  categoryModel,
  organisationModel,
  payModel,
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
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    const { start, end } = req.query;

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "Start date and end date is required",
      });
    }

    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);
    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    const totalSchedules = await scheduleModel.countDocuments({
      ...criteria,
    });
    const schedules = await allSchedules(criteria);
    const totalWastes = await totalWaste(criteria);
    const totalPayment = await totalpayout(criteria);
    const totalOutstanding = await totaloutstanding(criteria);
    const totalDropOff = await dropOffs(criteria);
    const totalMissed = await missed(criteria);
    const totalCompleted = await completed(criteria);
    const initPending = await pending(criteria);
    const allPending = await scheduleModel.countDocuments({
      ...criteria,
      completionStatus: "pending",
    });
    const allAccepted = await scheduleModel.countDocuments({
      ...criteria,
      completionStatus: "pending",
    });
    const totalCancelled = await cancelled(criteria);
    const totalWasterPickers = await wastePickers(criteria);
    const totalOrganisation = await organisation(criteria);
    // const allSchedulesCount =
    //   schedules.length - allPending + initPending + allAccepted;
    const totalInsuranceUsers = await insuranceUsers(criteria);
    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        schedules,
        totalSchedules,
        totalPending: initPending,
        totalMissed,
        totalCompleted,
        totalCancelled,
        totalDropOff,
        totalWasterPickers,
        totalOrganisation,
        totalWastes: Math.ceil(totalWastes),
        totalPayment: Math.ceil(totalPayment),
        totalOutstanding: Math.ceil(totalOutstanding),
        totalInsuranceUsers,
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

dashboardController.companyCardMapData = async (req, res) => {
  //bodyValidate(req, res);

  try {
    const { start, end, state } = req.query;
    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }
    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);
    const { _id: organisationId } = req.user;

    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    const schedules = await companyAllSchedules(criteria, organisationId);
    const totalWastes = await companyTotalWaste(criteria, organisationId);
    const totalPayment = await companyTotalpayout(criteria, organisationId);
    const totalOutstanding = await companyTotaloutstanding(
      criteria,
      organisationId
    );
    const totalDropOff = await companyDropOffs(criteria, organisationId);
    const totalMissed = await companyMissed(criteria, organisationId);
    const totalCompleted = await companyCompleted(criteria, organisationId);

    const totalCancelled = await companyCancelled(criteria, organisationId);
    const totalPending = await companyPending(criteria, organisationId);

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
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dashboardController.recentPickups = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
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

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
          { client: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
          { address: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        completionStatus: "completed",
        collectorStatus: "accept",
      };
    } else if (start || end) {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        completionStatus: "completed",
        collectorStatus: "accept",
      };
    } else {
      criteria = {};
    }
    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    console.log(criteria);

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
    const { user } = req;
    const currentScope = user.locationScope;

    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
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

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }
    //const { states } = req.user;

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
        //state: { $in: states },
      };
    } else if (start || end) {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createAt: {
          $gte: startDate,
          $lt: endDate,
        },
        roles: "client",
        // state: { $in: states },
      };
    } else {
      criteria = {};
    }
    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    console.log(criteria);

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
    const { user } = req;
    const currentScope = user.locationScope;

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

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
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
          // { IDNumber: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        //state: { $in: states },
      };
    } else if (start || end) {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        // state: { $in: states },
      };
    } else {
      criteria = {};
    }

    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    console.log(criteria);
    //if (state) criteria.state = state;

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
  try {
    const { user } = req;
    const currentScope = user.locationScope;

    const { start, end } = req.query;
    let collectorType = "collector";

    if (!start || !end) {
      return res.status(400).json({
        error: true,
        message: "Date range is required",
      });
    }
    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }

    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);

    if (req.query.collectorType) {
      collectorType = req.query.collectorType;
    }
    let criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      collectorType,
      //state: { $in: states },
    };

    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    const collectors = await allCollector(criteria);

    const totalVerified = await verified(criteria);
    const totalF = await totalFemale(criteria);
    const totalM = await totalMale(criteria);
    const newCollectorUsers = await newCollectors(criteria);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        collectors,
        totalCollectors: newCollectorUsers,
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
    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
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

  const schedules = await scheduleModel
    .find(criteria)
    .sort({ createdAt: -1 })
    .limit(100);
  return schedules;
};

const companyAllSchedules = async (criteria, organisationId) => {
  // get length of schedules within given date range

  const schedules = await scheduleModel
    .find({ ...criteria, organisationCollection: organisationId })
    .sort({ createdAt: -1 })
    .limit(100);
  return schedules;
};

const completed = async (criteria) => {
  const totalCompleted = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "completed",
    collectorStatus: { $ne: "" },
  });
  return totalCompleted;
};

const companyCompleted = async (criteria, organisationId) => {
  console.log("total completed", criteria);
  const totalCompleted = await scheduleModel.countDocuments({
    ...criteria,
    organisationCollection: organisationId,
    completionStatus: "completed",
    collectorStatus: "accept",
  });
  return totalCompleted;
};

const organisation = async (criteria) => {
  const condition = { ...criteria, isDisabled: false };
  condition.createAt = condition.createdAt;
  delete condition.createdAt;

  const totalOrganisation = await organisationModel.countDocuments(condition);

  return totalOrganisation;
};

const wastePickers = async (criteria) => {
  const totalwastePicker = await collectorModel.countDocuments({
    ...criteria,
    collectorType: "waste-picker",
  });

  return totalwastePicker;
};

const insuranceUsers = async (criteria) => {
  const c = {
    createAt: criteria.createdAt,
    state: criteria.state,
    insuranceUser: true,
  };
  const total = await userModel.countDocuments(c);

  return total;
};

const companyWastePickers = async (criteria, organisationId) => {
  console.log("total wasp", criteria);

  const totalwastePicker = await collectorModel.countDocuments({
    ...criteria,
    approvedBy: organisationId,
    collectorType: "waste-picker",
  });

  return totalwastePicker;
};

const missed = async (criteria) => {
  const totalMissed = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "missed",
  });
  return totalMissed;
};

const companyMissed = async (criteria, organisationId) => {
  const totalMissed = await scheduleModel.countDocuments({
    ...criteria,
    organisationCollection: organisationId,
    completionStatus: "missed",
  });
  return totalMissed;
};

const pending = async (criteria) => {
  const totalPending = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "pending",
    collectorStatus: "decline",
  });
  return totalPending;
};

const companyPending = async (criteria, organisationId) => {
  console.log("cat", criteria);
  const newCat = { ...criteria };
  delete newCat.organisationCollection;
  console.log("n", newCat);
  const active_today = new Date();
  active_today.setHours(0);
  active_today.setMinutes(0);

  const totalPending = await scheduleModel.find({
    ...newCat,
    expiryDuration: {
      $gt: active_today,
    },
    //organisationCollection: organisationId,
    completionStatus: "pending",
    collectorStatus: "decline",
  });

  const company = await organisationModel.findById(organisationId);

  const accessArea = company.streetOfAccess;

  let schedules = [];

  totalPending.forEach((schedule) => {
    if (accessArea.includes(schedule.lcd)) {
      schedules.push(schedule);
    }
  });

  // remove duplicate schedules
  schedules = [...new Set(schedules)];

  return schedules.length;
};

const cancelled = async (criteria) => {
  const totalCancelled = await scheduleModel.countDocuments({
    ...criteria,
    completionStatus: "cancelled",
  });
  return totalCancelled;
};

const companyCancelled = async (criteria, organisationId) => {
  const totalCancelled = await scheduleModel.countDocuments({
    ...criteria,
    organisationCollection: organisationId,
    completionStatus: "cancelled",
  });
  return totalCancelled;
};

const dropOffs = async (criteria) => {
  const totalResult = await scheduleDropModel.countDocuments(criteria);
  return totalResult;
};

const companyDropOffs = async (criteria, organisationId) => {
  criteria.organisationCollection = organisationId;
  console.log("total dropoffs", criteria);
  const totalResult = await scheduleDropModel.countDocuments({
    ...criteria,
    completionStatus: "pending",
    organisationCollection: organisationId,
  });
  return totalResult;
};

const totalWaste = async (criteria) => {
  const transactions = await transactionModel.find(criteria);

  const totalWastes = transactions
    .map((x) => x.weight)
    .reduce((acc, curr) => acc + curr, 0);

  return totalWastes;
};

const companyTotalWaste = async (criteria, organisationId) => {
  console.log("totalwaste", criteria);
  const transactions = await transactionModel.find({
    ...criteria,
    organisationID: organisationId,
  });

  const totalWastes = transactions
    .map((x) => x.weight)
    .reduce((acc, curr) => acc + curr, 0);

  return totalWastes;
};

const totalpayout = async (criteria) => {
  console.log("totalPayout", criteria);
  const condition = {
    ...criteria,
    paid: true,
  };

  const transactions = await payModel.find(condition);
  const totalpayouts = transactions
    .map((x) => x.amount)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const companyTotalpayout = async (criteria, organisationId) => {
  console.log("totalPayout", criteria);
  const condition = {
    ...criteria,
    organisationID: organisationId,
    paid: true,
  };

  const transactions = await payModel.find(condition);
  const totalpayouts = transactions
    .map((x) => x.amount)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const totaloutstanding = async (criteria) => {
  const condition = {
    ...criteria,
    paid: false,
  };

  const transactions = await payModel.find(condition);

  const totalpayouts = transactions
    .map((x) => x.amount)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const companyTotaloutstanding = async (criteria, organisationId) => {
  const condition = {
    ...criteria,
    organisationID: organisationId,
    paid: false,
  };

  const transactions = await payModel.find(condition);

  const totalpayouts = transactions
    .map((x) => x.amount)
    .reduce((acc, curr) => acc + curr, 0);
  return totalpayouts;
};

const totalMale = async (criteria) => {
  return await collectorModel.countDocuments({
    ...criteria,
    gender: "male",
    // collectorType: "collector",
  });
};

const totalFemale = async (criteria) => {
  return await collectorModel.countDocuments({
    ...criteria,
    gender: "female",
    // collectorType: "collector",
  });
};

const verified = async (criteria) => {
  return await collectorModel.countDocuments({
    ...criteria,
    verified: true,
  });
};

const newCollectors = async (criteria) => {
  const ONE_MONTH_AGO = new Date() - 1000 * 60 * 60 * 24 * 30;
  return await collectorModel.countDocuments({
    ...criteria,
    createdAt: {
      $gte: ONE_MONTH_AGO,
    },
    verified: true,
    companyVerified: false,
  });
};
const allCollector = async (criteria) => {
  return await collectorModel.find(criteria);
};

module.exports = dashboardController;
