"use strict";

let agenciesController = {};
const MODEL = require("../models");
const COMMON_FUN = require("../util/commonFunction");
const mongodb = require("mongodb");

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
    console.log("body", body);
    const user = await MODEL.userModel.findOne({ email: body.email.trim() });
    if (user) {
      return res.status(400).json({
        error: true,
        message: "Email already exist",
      });
    }

    const role = await MODEL.roleModel.findOne({
      _id: new mongodb.ObjectId(body.role),
      active: true,
    });
    if (!role) {
      return res.status(400).json({
        error: true,
        message: "Role not found or not active",
      });
    }

    const checkPhone = await MODEL.userModel.findOne({
      phone: body.phone,
    });

    console.log("c", checkPhone);

    if (checkPhone) {
      return res.status(400).json({
        error: true,
        message: "Phone number already exist",
      });
    }

    const password = body.email.split("@");
    console.log(password[0]);

    const agency = await MODEL.userModel.create({
      countries: body.countries,
      states: body.states,
      username: body.name.trim(),
      role: role._id,
      displayRole: role.title,
      roles: role.group,
      email: body.email,
      password: await COMMON_FUN.encryptPassword(password[0]),
      verified: true,
      phone: body.phone,
    });

    await MODEL.userModel.updateOne(
      { email: agency.email },
      { cardID: agency._id }
    );

    //send mail to the company holding the agencies password

    return res.status(200).json({
      error: false,
      message: "User agency created successfully",
      data: {
        name: agency.username,
        countries: agency.countries,
        states: agency.states,
        role: agency.displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
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

agenciesController.getAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const agencies = await MODEL.userModel
      .find({
        roles: "admin",
      })
      .sort({ _id: -1 });

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
      data: {
        name: agency.username,
        countries: agency.countries,
        states: agency.states,
        role: agency.displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
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

agenciesController.updateAgencies = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const agencyId = req.params.agencyId;
    const agency = await MODEL.userModel.findById(agencyId);
    const { user } = req;

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
      roles = agency.roles;
    }

    if (body.status) {
      if (user.email === agency.email) {
        return res.status(400).json({
          error: true,
          message: "Action cannot be perform",
        });
      }
    }

    const update = await MODEL.userModel.updateOne(
      { _id: agency._id },
      {
        username: body.name || agency.userrname,
        email: body.email || agency.email,
        countries: body.countries || agency.countries,
        states: body.states || agency.states,
        role,
        roles,
        status: body.status || agency.status,
      }
    );

    agency.username = body.name || agency.name;
    agency.email = body.email || agency.email;
    agency.countries = body.countries || agency.countries;
    agency.states = body.states || agency.states;
    agency.role = body.role || agency.role;
    agency.roles = body.roles || agency.roles;
    agency.status = body.status || agency.status;

    if (!update) {
      return res.status(400).json({
        error: true,
        message: "An error occurred",
      });
    }

    return res.status(200).json({
      error: false,
      message: "User updated successfully",
      data: {
        name: agency.username,
        countries: agency.countries,
        states: agency.states,
        role: agency.displayRole,
        roles: agency.roles,
        email: agency.email,
        phone: agency.phone,
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
