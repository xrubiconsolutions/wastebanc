"use strict";

let activitesController = {};
const MODEL = require("../models");
const { validationResult, body } = require("express-validator");

const bodyValidate = (req, res) => {
  // 1. Validate the request coming in
  // console.log(req.body);
  const result = validationResult(req);

  const hasErrors = !result.isEmpty();

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
  return;
};

activitesController.add = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const activities = await MODEL.activitesModel.create({
      userType: body.type,
      userId: body.userId,
      message: body.message,
      activity_type: body.activity_type,
    });

    return res.status(200).json({
      error: false,
      message: "Activity added successfully",
      data: activities,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

activitesController.get = async (req, res) => {
  bodyValidate(req, res);
  try {
    const userId = req.params.userId;
    const userType = req.query.type;
    const limit = req.query.limit || 10;

    const activites = await MODEL.activitesModel
      .find({
        userId,
        userType,
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      error: false,
      message: "Recent activities",
      data: activites,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

module.exports = activitesController;
