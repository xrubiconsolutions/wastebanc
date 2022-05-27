"use strict";

/**************************************************
 ***** Category controller for user business logic ****
 **************************************************/
let categoryController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");

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
};

const getSlug = (data) => {
  let slug = data.toString();
  if (slug.includes(" / ")) {
    while (slug.includes(" / ")) {
      slug = slug.replace(" / ", "-");
    }
  } else if (slug.includes(" ")) {
    while (slug.includes(" ")) {
      slug = slug.replace(" ", "-");
    }
  } else {
    slug = slug.replace(" ", "-");
  }
  return slug.toLowerCase();
};

categoryController.addCategory = async (req, res) => {
  //bodyValidate(req, res);
  try {
    const name = req.body.name;
    const value = getSlug(req.body.name);
    const cat = await MODEL.categoryModel.findOne({
      name,
    });

    if (cat) {
      return res.status(400).json({
        message: "Category with this name already exist",
        statusCode: 400,
      });
    }
    //fixed
    const store = await MODEL.categoryModel.create({
      name,
      value,
      wastepicker: req.body.wastepicker,
    });

    return res.status(200).json({
      message: "New Category added successfully",
      statusCode: 200,
      data: store,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

categoryController.allCategories = async (req, res) => {
  try {
    const catgories = await MODEL.categoryModel.find({});
    return res.status(200).json({
      message: "All categories",
      statusCode: 200,
      data: catgories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

categoryController.getCategory = async (req, res) => {
  //bodyValidate(req, res);
  try {
    const catId = req.params.catId;
    const cat = await MODEL.categoryModel.findById(catId);
    if (!cat) {
      return res.status(400).json({
        message: "Category not found",
        statusCode: 400,
      });
    }
    return res.status(200).json({
      message: "Category",
      statusCode: 200,
      data: cat,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

categoryController.updateCategory = async (req, res) => {
  //bodyValidate(req, res);
  try {
    const catId = req.params.catId;

    const cat = await MODEL.categoryModel.findById(catId);
    if (!cat) {
      return res.status(400).json({
        message: "Category not found",
        statusCode: 400,
      });
    }
    const name = req.body.name || cat.name;
    const pickerPrice = req.body.wastepicker || cat.wastepicker;

    const update = await MODEL.categoryModel.updateOne(cat._id, {
      name,
      wastepicker: pickerPrice,
    });
    cat.name = name;
    cat.wastepicker = pickerPrice;
    return res.status(200).json({
      message: "Category updated successfully",
      statusCode: 200,
      data: update,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

categoryController.deleteCategory = async (req, res) => {
  //bodyValidate(req, res);
  try {
    const catId = req.params.catId;
    const cat = await MODEL.categoryModel.findById(catId);
    if (!cat) {
      return res.status(400).json({
        message: "Category not found",
        statusCode: 400,
      });
    }
    const remove = await MODEL.categoryModel.deleteOne({ _id: cat.id });
    return res.status(200).json({
      message: "Category removed successfully",
      statusCode: 200,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      statusCode: 500,
    });
  }
};

module.exports = categoryController;
