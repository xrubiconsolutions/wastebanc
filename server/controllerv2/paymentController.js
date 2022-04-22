const { payModel, charityModel } = require("../models");
const transactionModel = require("../models/transactionModel");
const paymentController = {};
const { bodyValidate } = require("../util/constants");

paymentController.paymentHistory = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      paid,
      key,
      // state,
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // if (!key) {
    //   if (!start || !end) {
    //     return res.status(400).json({
    //       error: true,
    //       message: "Please pass a start and end date",
    //     });
    //   }
    // }

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { userPhone: { $regex: `.*${key}.*`, $options: "i" } },
          { bankAcNo: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        paid,
      };
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        paid,
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

    const totalResult = await payModel.countDocuments(criteria);

    const payments = await payModel
      .find(criteria)
      .sort({ created: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        payments,
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

paymentController.charityHistory = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // if (!key) {
    //   if (!start || !end) {
    //     return res.status(400).json({
    //       error: true,
    //       message: "Please pass a start and end date",
    //     });
    //   }
    // }

    let criteria;

    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { aggregatorOrganisation: { $regex: `.*${key}.*`, $options: "i" } },
          // {
          //   quantityOfWaste: { $regex: `.*${ParseInt(key)}.*`, $options: "i" },
          // },
          // { amount: { $regex: `.*${ParseInt(key)}.*`, $options: "i" } },
        ],
      };
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
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

    const totalResult = await charityModel.countDocuments(criteria);
    const charities = await charityModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        charities,
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

paymentController.getCompanyOutstanding = async (req, res) => {
  let { page = 1, resultsPerPage = 20, start, end, key, state } = req.query;
  if (typeof page === "string") page = parseInt(page);
  if (typeof resultsPerPage === "string")
    resultsPerPage = parseInt(resultsPerPage);

  if (!key && (!start || !end))
    return res.status(400).json({
      error: true,
      message: "Please pass a start and end date or a search key",
    });

  let { _id: organisation } = req.user;
  // organisationID = organisationID.toString();
  organisation = "6033f9f971af350024ae6185";
  let criteria;

  if (key) {
    criteria = {
      $or: [
        { fullname: { $regex: `.*${key}.*`, $options: "i" } },
        { aggregatorId: { $regex: `.*${key}.*`, $options: "i" } },
        { recycler: { $regex: `.*${key}.*`, $options: "i" } },
      ],
      paid: false,
      organisation,
      requestedForPayment: true,
    };
  } else {
    const [startDate, endDate] = [new Date(start), new Date(end)];
    criteria = {
      createdAt: {
        $gte: startDate,
        $lt: endDate,
      },
      paid: false,
      organisation,
      requestedForPayment: true,
    };
  }

  try {
    // totalResult count
    const totalResult = await transactionModel.countDocuments(criteria);

    // paginated outstanding payment
    const outstandingPayments = await transactionModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        outstandingPayments,
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
      message: "An error occured",
    });
  }
};

paymentController.companyCharityHistory = async (req, res) => {
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

    let { _id: organisation } = req.user;
    organisation = organisation.toString();
    let criteria;

    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { aggregatorName: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisation,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisation,
      };
    }
    if (state) criteria.state = state;

    const totalResult = await charityModel.countDocuments(criteria);
    const charities = await charityModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        charities,
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

paymentController.companyPaymentHistory = async (req, res) => {
  try {
    let { page = 1, resultsPerPage = 20, start, end, key, state } = req.query;
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
    let { _id: organisation } = req.user;
    organisation = organisation.toString();

    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { userPhone: { $regex: `.*${key}.*`, $options: "i" } },
          { bankAcNo: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        paid: true,
        organisation,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        paid: true,
        organisation,
      };
    }
    if (state) criteria.state = state;

    const totalResult = await payModel.countDocuments(criteria);

    const payments = await payModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        payments,
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

module.exports = paymentController;
