const { payModel, charityModel } = require("../models");
const paymentController = {};
const { bodyValidate } = require("../util/constants");

paymentController.paymentHistory = async (req, res) => {
  try {
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      paid,
      key,
      state,
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
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { userPhone: { $regex: `.*${key}.*`, $options: "i" } },
          { bankAcNo: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        paid,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        paid,
      };
    }
    if (state) criteria.state = state;

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
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { aggregatorOrganisation: { $regex: `.*${key}.*`, $options: "i" } },
          { quantityOfWaste: { $regex: `.*${key}.*`, $options: "i" } },
          { amount: { $regex: `.*${key}.*`, $options: "i" } },
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

module.exports = paymentController;
