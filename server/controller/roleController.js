"use strict";

let roleController = {};
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

roleController.create = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const check = await MODEL.roleModel.findOne({
      title: body.title,
      group: body.group,
    });
    if (check) {
      return res.status(400).json({
        error: true,
        message: "Role already exist for the access group",
      });
    }

    const role = await MODEL.roleModel.create(body);
    return res.status(200).json({
      error: false,
      message: "Role added successfully",
      data: role,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

roleController.roles = async (req, res) => {
  try {
    const roles = await MODEL.roleModel.find().populate({
      path: "cliams.claim",
    });

    return res.status(200).json({
      error: false,
      message: "roles",
      data: roles,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

roleController.getRole = async (req, res) => {
  bodyValidate(req, res);
  try {
    const roleId = req.params.roleId;
    const role = await MODEL.roleModel.findById(roleId).populate({
      path: "cliams.claim",
    });
    if (!role) {
      return res.status(400).json({
        error: true,
        message: "",
      });
    }

    return res.status(200).json({
      error: false,
      message: "role",
      data: role,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

roleController.update = async (req, res) => {
  bodyValidate(req, res);
  try {
    const roleId = req.params.roleId;
    const body = req.body;
    const role = await MODEL.roleModel.findById(roleId);
    if (!role) {
      return res.status(400).json({
        error: true,
        message: "",
      });
    }

    const update = await MODEL.roleModel.updateOne({ _id: role._id }, body);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

roleController.disable = async (req, res) => {
  bodyValidate(req, res);
  try {
    const roleId = req.params.roleId;
    const remove = await MODEL.roleModel.findByIdAndDelete(roleId);

    if (!remove) {
      return res.status(400).json({
        error: true,
        message: "An error occurred",
      });
    }

    // disable all users and companies using this role to prevent them gaining access to the system until their role is changed
    return res.status(200).json({
      error: false,
      message: "Role ",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};
module.exports = roleController;
