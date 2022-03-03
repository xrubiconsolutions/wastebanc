"use strict";

let locationController = {};
const MODEL = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const SERVICE = require("../services/commonService");
const CONSTANTS = require("../util/constants");

const { validationResult, body } = require("express-validator");
const {
  CountryContext,
} = require("twilio/lib/rest/pricing/v1/phoneNumber/country");

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

locationController.create = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const checkCountry = await MODEL.locationModel.findOne({
      country: body.country,
    });

    if (checkCountry) {
      return res.status(400).json({
        error: true,
        message: "Country already exist",
      });
    }

    const location = await MODEL.locationModel.create({
      country: body.country,
      state: body.state,
    });

    return res.status(200).json({
      error: false,
      message: "Location Added successfully",
      data: location,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

locationController.update = async (req, res) => {
  bodyValidate(req, res);

  try {
    const body = req.body;
    const countryId = req.param.countryId;
    const country = await MODEL.locationModel.findById(countryId);
    if (!country) {
      return res.status(400).json({
        error: true,
        message: "Country not found",
      });
    }

    await MODEL.locationModel.updateOne(country._id, {
      country: body.country || country.country,
      state: body.state || country.state,
    });

    country.country = body.country || country.country;
    CountryContext.state = body.state || body.state;
    return res.status(200).json({
      error: false,
      message: "Location updated successfully",
      data: country,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

locationController

module.exports = locationController;
