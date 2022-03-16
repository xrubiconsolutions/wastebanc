const { scheduleDropModel, dropOffModel } = require("../models");
let dropoffController = {};

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

dropoffController.dropOffs = async (req, res) => {
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
          { scheduleCreator: key },
          { fullname: key },
          { completionStatus: key },
          { organisation: key },
          { phone: key },
          { organisationPhone: key },
          { quantity: key },
          { categories: { $in: [key] } },
          { Category: key },
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

    const totalResult = await scheduleDropModel.countDocuments(criteria);

    const dropoffs = await scheduleDropModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        dropoffs,
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

dropoffController.companydropOffs = async (req, res) => {
  try {
    const { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    const { companyName: organisation } = req.user;

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

    if (key) {
      criteria = {
        $or: [
          { scheduleCreator: key },
          { fullname: key },
          { completionStatus: key },
          { organisation: key },
          { phone: key },
          { organisationPhone: key },
          // { quantity: key },
          { categories: { $in: [key] } },
          { Category: key },
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

    console.log("c", criteria);
    if (state) criteria.state = state;

    const totalResult = await scheduleDropModel.countDocuments(criteria);

    const dropoffs = await scheduleDropModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        dropoffs,
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

dropoffController.deleteDropOff = async (req, res) => {
  const { dropOffId } = req.body;
  const { companyName: organisation } = req.user;
  try {
    const drop = await scheduleDropModel.findOneAndDelete({
      _id: dropOffId,
      organisation,
    });
    if (!drop)
      return res.status(404).json({
        error: true,
        message: "Drop-off schedule data couldn't be found",
      });

    return res.status(200).json({
      error: false,
      message: "Drop-off removed successfully!",
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

dropoffController.addDropOffLocation = async (req, res) => {
  const dropLocation = { ...req.body };
  try {
    const drop = await dropOffModel.create(dropLocation);
    return res.status(201).json({
      error: false,
      message: "Drop-off submitted successfully!",
      data: drop,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

module.exports = dropoffController;
