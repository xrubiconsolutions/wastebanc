"use strict";

let locationController = {};
const MODEL = require("../models");
// const COMMON_FUN = require("../util/commonFunction");
// const SERVICE = require("../services/commonService");
// const CONSTANTS = require("../util/constants");

const { validationResult, body } = require("express-validator");
// const {
//   CountryContext,
// } = require("twilio/lib/rest/pricing/v1/phoneNumber/country");

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
      states: body.states,
    });

    return res.status(200).json({
      error: false,
      message: "Location Added successfully",
      data: location,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.locations = async (req, res) => {
  try {
    const locations = await MODEL.locationModel.find(
      {},
      {
        _id: 1,
        country: 1,
        states: 1,
      }
    );
    if (locations.length == 0) {
      return res.status(400).json({
        error: true,
        message: "No location in the system",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Available Locations",
      data: locations,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.getLocation = async (req, res) => {
  bodyValidate(req, res);
  try {
    const locationId = req.params.locationId;
    const location = await MODEL.locationModel.findById(locationId, {
      _id: 1,
      country: 1,
      states: 1,
    });
    if (!location) {
      return res.status(400).json({
        error: true,
        message: "location not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "success",
      data: location,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.update = async (req, res) => {
  bodyValidate(req, res);

  try {
    const body = req.body;
    const locationId = req.params.locationId;
    const country = await MODEL.locationModel.findById(locationId);
    if (!country) {
      return res.status(400).json({
        error: true,
        message: "Country not found",
      });
    }

    await MODEL.locationModel.updateOne(
      { _id: country._id },
      {
        country: body.country || country.country,
        states: body.states || country.states,
      }
    );

    country.country = body.country || country.country;
    country.states = body.states || body.states;
    return res.status(200).json({
      error: false,
      message: "Location updated successfully",
      data: country,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.remove = async (req, res) => {
  bodyValidate(req, res);

  try {
    const locationId = req.params.locationId;
    const location = await MODEL.locationModel.findById(locationId);
    if (!location) {
      return res.status(400).json({
        error: true,
        message: "Location not found",
      });
    }

    const remove = await MODEL.locationModel.deleteOne({
      _id: location._id,
    });

    if (!remove) {
      return res.status(400).json({
        error: true,
        message: "Error removing location",
      });
    }

    return res.status(200).json({
      error: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.worldlocations = async (req, res) => {
  try {
    const locations = await MODEL.worldlocationModel.find({});
    return res.status(200).json({
      error: false,
      message: "success",
      data: locations,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.getLGA = async (req, res) => {
  try {
    const { state = "Lagos" } = req.query;
    const results = await MODEL.localGovernmentModel
      .find({
        state,
      })
      .select({ lga: 1 });
    return res.status(200).json({
      error: false,
      message: "success",
      data: results,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      error: true,
      message: "An error occurred",
    });
  }
};

locationController.accessArea = async (req, res) => {
  try {
    const { state = "Lagos", lga } = req.query;
    const results = await MODEL.localGovernmentModel
      .find({
        state,
        lga,
      })
      .select({ lcd: 1 });
    return res.status(200).json({
      error: false,
      message: "success",
      data: results,
    });
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      error: true,
      message: "An error occurred",
    });
  }
};
module.exports = locationController;
