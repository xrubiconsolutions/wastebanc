"use strict";

let organisationController = {};
const { organisationModel, transactionModel } = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");

organisationController.getOrganisationCompleted = async (req, res) => {
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
        $or: [{ organisation: { $regex: `.*${key}.*`, $options: "i" } }],
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

    //console.log("c", criteria);
    const skip = (page - 1) * resultsPerPage;
    const limit = skip + resultsPerPage;

    const totalResult = await transactionModel.countDocuments(criteria);
    const d = await transactionModel.aggregate([
      {
        $match: criteria,
      },
      {
        $group: { _id: "$organisation", total: { $sum: "$weight" } },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $skip: skip,
      },
    ]);

    console.log("d", d);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        result: d,
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

organisationController.listOrganisation = async (req, res) => {
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
          { companyName: { $regex: `.*${key}.*`, $options: "i" } },
          {
            email: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            companyTag: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            "areaOfAccess.*": { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            "streetOfAccess.*": { $regex: `.*${key}.*`, $options: "i" },
          },
        ],
      };

      const totalResult = await organisationModel.countDocuments(criteria);
      const organisations = await organisationModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          organisations,
          totalResult,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalResult / resultsPerPage),
        },
      });
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

module.exports = organisationController;
