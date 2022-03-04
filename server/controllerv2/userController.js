"use strict";

let userController = {};
const MODEL = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const SERVICE = require("../services/commonService");
const CONSTANTS = require("../util/constants");
const request = require("request");
const streamifier = require("streamifier");
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

userController.registerUserV2 = async (req, res) => {
  bodyValidate(req, res);
  const body = req.body;
  let user;

  try {
     user = await MODEL.userModel.findOne({
      phone: body.phone,
    });

    if(user){
        return res.status(400).json({
            error: true,
            message: "User already exists"
        })
    }

    const password = await COMMON_FUN.encryptPassword(body.password);

     user = await MODEL.userModel.create(body);
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      statusCode: 500,
    });
  }
};

userController.loginUserV2 = async (req, res) => {
  bodyValidate(req, res);
  try {
    const user = await MODEL.userModel.findOne({
      phone: req.body.phone,
    });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid credentials",
        statusCode: 400,
      });
    }

    if (!(await COMMON_FUN.comparePassword(req.body.password, user.password))) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    await MODEL.userModel.updateOne(
      { _id: user._id },
      { last_logged_in: new Date() }
    );
    const token = COMMON_FUN.authToken(user);
    delete user.password;
    return res.status(200).json({
      error: false,
      message: "Login successfull",
      statusCode: 200,
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        othernames: user.othernames,
        address: user.address,
        roles: user.roles,
        countryCode: user.countryCode,
        verified: user.verified,
        availablePoints: user.availablePoints,
        rafflePoints: user.rafflePoints,
        schedulePoints: user.schedulePoints,
        cardID: user.cardID,
        lcd: user.lcd,
        last_logged_in: user.last_logged_in,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      statusCode: 500,
    });
  }
};

userController.adminLogin = async (req, res) => {
  bodyValidate(req, res);
  const email = req.body.email;
  try {
    const user = await MODEL.userModel.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    if (user.role === "client") {
      return res.status(400).json({
        error: true,
        message: "Unauthorized",
        statusCode: 401,
      });
    }

    if (!(await COMMON_FUN.comparePassword(req.body.password, user.password))) {
      return res.status(400).json({
        error: true,
        message: "Invalid email or password",
        statusCode: 400,
      });
    }

    await MODEL.userModel.updateOne(
      { _id: user._id },
      { last_logged_in: new Date() }
    );
    const token = COMMON_FUN.authToken(user);
    delete user.password;
    return res.status(200).json({
      error: false,
      message: "Login successfull",
      statusCode: 200,
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        othernames: user.othernames,
        address: user.address,
        roles: user.roles,
        countryCode: user.countryCode,
        verified: user.verified,
        availablePoints: user.availablePoints,
        rafflePoints: user.rafflePoints,
        schedulePoints: user.schedulePoints,
        cardID: user.cardID,
        lcd: user.lcd,
        last_logged_in: user.last_logged_in,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
      statusCode: 500,
    });
  }
};
