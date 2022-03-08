"use strict";

let agenciesController = {};
const MODEL = require("../models");
const COMMON_FUN = require("../util/commonFunction");

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

agenciesController.create = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const user = await MODEL.userModel.findOne({ email: body.email.trim() });
    if (user) {
      return res.status(400).json({
        error: true,
        message: "Email already exist",
      });
    }

    const role = await MODEL.roleModel.findOne({
      title: body.title,
      active: true,
    });
    if (!role) {
      return res.status(400).json({
        error: true,
        message: "Role not found or not active",
      });
    }

    const agency = await MODEL.userModel.create({
      countries: body.counties,
      states: body.states,
      address: null,
      username: body.name.trim(),
      role: role.title,
      roles: role.group,
      email: body.email,
      password: await COMMON_FUN.encryptPassword("1234567"),
      verified: true,
    });

    await MODEL.userModel.updateOne(
      { email: agency.email },
      { cardID: agency._id }
    );

    //send mail to the company holding the agencies password

    return res.status(200).json({
      error: false,
      message: "User agency created successfully",
      data: agency,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.getAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencies = await MODEL.userModel.find({
      roles: "admin",
    });

    return res.status(200).json({
      error: false,
      message: "User agencies",
      data: agencies,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.findAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    delete agency.password;
    return res.status(200).json({
      error: false,
      message: "User found",
      data: agency,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.updateAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    let role;
    let roles;
    if (body.role) {
      role = await MODEL.roleModel.findOne({
        title: body.title,
        active: true,
      });
      if (!role) {
        return res.status(400).json({
          error: true,
          message: "Role not found or not active",
        });
      }
      roles = role.group;
    } else {
      role = agency.role;
      roles = agency.group;
    }
    const update = await MODEL.userMode.updateOne(
      { _id: agency._id },
      {
        username: body.name || agency.name,
        email: body.email || agency.email,
        countries: body.countries || agency.countries,
        states: body.states || agency.states,
        role,
        roles,
        status: body.status || agency.status,
      }
    );

    if (!update) {
      return res.status(400).json({
        error: true,
        message: "An error occurred",
      });
    }

    return res.status(200).json({
      error: false,
      message: "User updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

agenciesController.remove = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    if (!agency) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    const moveToBin = await MODEL.userBinModel.create(agency);
    if (!moveToBin) {
      return res.status(400).json({
        error: true,
        message: "An error occurred",
      });
    }
    await MODEL.userModel.deleteOne({ _id: agency._id });
    return res.status(200).json({
      error: false,
      message: "user deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

module.exports = agenciesController;
