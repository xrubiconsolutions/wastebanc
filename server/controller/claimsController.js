"use strict";

let claimsController = {};
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

claimsController.create = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const CRITERIA = {
      $or: [{ title: body.title }, { path: body.path }],
    };
    const check = await MODEL.claimsModel.findOne(CRITERIA);
    if (check) {
      return res.status(400).json({
        error: true,
        message: "Menu already exist",
      });
    }

    const claim = await MODEL.claimsModel.create(body);
    return res.status(200).json({
      error: false,
      message: "Menu added successfully",
      data: claim,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

claimsController.claims = async (req, res) => {
  bodyValidate(req, res);
  try {
    // const filter = req.query.filter;
    const claims = await MODEL.claimsModel
      .find({
        // dashboard: { $in: [`${filter}`] },
        level: "0",
        show: true,
      })
      .populate({
        path: "children",
        match: { show: true },
        populate: {
          path: "children",
          match: { show: true },
          populate: {
            path: "children",
            match: { show: true },
          },
        },
      });
    return res.status(200).json({
      error: false,
      message: "Available menus",
      data: claims,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

claimsController.getClaim = async (req, res) => {
  bodyValidate(req, res);
  try {
    const claimId = req.param.claimId;
    const claim = await MODEL.claimsModel.findById(claimId);
    if (!claim) {
      return res.status(400).json({
        error: true,
        message: "Menu not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "success",
      data: claim,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

claimsController.update = async (req, res) => {
  bodyValidate(req, res);

  try {
    const body = req.body;
    const claimId = req.param.claimId;
    const claim = await MODEL.claimsModel.findById(claimId);
    if (!claim) {
      return res.status(400).json({
        error: true,
        message: "Menu not found",
      });
    }

    await MODEL.claimsModel.updateOne(
      { _id: claim._id },
      {
        path: body.path || claim.path,
        icon: body.icon || claim.icon,
        title: body.title || claim.title,
        ancestor: body.ancestor || claim.ancestor,
        children: body.children || claim.children,
        iconClosed: body.iconClosed || claim.iconClosed,
        show: body.show || claim.show,
        position: body.position || claim.position,
        dashboard: body.dashboard || claim.dashboard,
      }
    );

    claim.path = body.path || claim.path;
    claim.icon = body.icon || claim.icon;
    claim.title = body.title || claim.title;
    claim.ancestor = body.ancestor || claim.ancestor;
    claim.children = body.children || claim.children;
    claim.iconClosed = body.iconClosed || claim.iconClosed;
    claim.show = body.show || claim.show;
    claim.position = body.position || claim.position;
    claim.dashboard = body.dashboard || claim.dashboard;

    return res.status(200).json({
      error: false,
      message: "success",
      data: claim,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};

claimsController.remove = async (req, res) => {
  bodyValidate(req, res);

  try {
    const claimId = req.param.claimId;
    const remove = await MODEL.claimsModel.findByIdAndDelete(claimId);
    console.log(remove);
    if (!remove) {
      return res.status(400).json({
        error: true,
        message: "Error removing side menu",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Side Menu removed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
};
module.exports = claimsController;
