"use strict";

let areasController = {};
const { localGovernmentModel } = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");

areasController.create = async (req, res) => {
  try {
    const check = await localGovernmentModel.findOne({
      lcd: req.body.coverageArea,
      lga: req.body.lga,
    });

    if (check) {
      return res.status(400).json({
        error: true,
        message: "Coverage already exist for lga",
      });
    }

    let lga, lcd;

    if (req.body.lga.includes(" ")) {
      lga = req.body.lga.replace(" ", "-").toLowerCase();
    } else if (req.body.lcd.includes(" ")) {
      lcd = req.body.lcd.replace(" ", "-").toLowerCase();
    } else {
      lga = req.body.lga.toLowerCase();
      lcd = req.body.lcd.toLowerCase();
    }
    const slug = `${lga}-${lcd}`;
    const create = await localGovernmentModel.create({
      lcd: req.body.coverageArea,
      lga: req.body.lga,
      country: req.body.country || "",
      state: req.body.state || "",
      slug,
    });

    return res.status(200).json({
      error: true,
      message: "Coverage Area added",
      data: create,
    });
  } catch (error) {
    console.log(error);
    return res.status({
      error: true,
      message: "An error occurred",
    });
  }
};

areasController.update = async (req, res) => {
  try {
    bodyValidate(req, res);
    const id = req.params.areaId;
    const area = await localGovernmentModel.findById(id);
    if (!area) {
      return res.status(400).json({
        error: true,
        message: "Area not found",
      });
    }
    await localGovernmentModel.updateOne(
      { _id: area._id },
      {
        lcd: req.body.coverageArea || area.lcd,
        lga: req.body.lga || area.lga,
      }
    );

    area.lcd = req.body.coverageArea || area.lcd;
    area.lga = req.body.lga || area.lga;

    return res.status(200).json({
      error: false,
      message: "Area updated successfully",
      data: area,
    });
  } catch (error) {
    console.log(error);
    return res.status({
      error: true,
      message: "An error occurred",
    });
  }
};

areasController.find = async (req, res) => {
  try {
    bodyValidate(req, res);
    const area = await localGovernmentModel.findById(req.params.areaId);
    if (!area) {
      return res.status(400).json({
        error: true,
        message: "Area not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "success",
      data: area,
    });
  } catch (error) {
    console.log(error);
    return res.status({
      error: true,
      message: "An error occurred",
    });
  }
};

areasController.getLcd = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;

    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // if (!key) {
    //   if (!start || !end) {
    //     return res.status(400).json({
    //       error: true,
    //       message: "Please pass a start and end date",
    //     });
    //   }
    // }

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { lcd: { $regex: `.*${key}.*`, $options: "i" } },
          { lga: { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };
    } else if (start || end) {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    } else {
      criteria = {};
    }

    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    // if (state) criteria.state = state;

    // const skip = (page - 1) * resultsPerPage;

    const totalResult = await localGovernmentModel.countDocuments(criteria);
    const areas = await localGovernmentModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        areas,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status({
      error: true,
      message: "An error occurred",
    });
  }
};

areasController.remove = async (req, res) => {
  try {
    const areaId = req.params.areaId;
    const remove = await localGovernmentModel.findByIdAndDelete(areaId);
    if (!remove) {
      return res.status(400).json({
        error: true,
        message: "Area not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: " Area removed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

areasController.scriptArea = async (req, res) => {
  try {
    const alllCDA = await localGovernmentModel.find({});

    console.log("alllCDA", alllCDA);
    if (alllCDA.length > 0) {
      await Promise.all(
        alllCDA.map(async (lga) => {
          if (lga.slug) {
            let localgov = lga.lga;
            let lcd = lga.lcd;

            if (localgov.includes(" ")) {
              localgov = localgov.replace(" ", "-").toLowerCase();
            } else if (lcd.includes(" ")) {
              lcd = lcd.replace(" ", "-").toLowerCase();
            } else {
              localgov = localgov.toLowerCase();
              lcd = lcd.toLowerCase();
            }
            const slug = `${localgov}-${lcd}`;
            await localGovernmentModel.updateOne(
              { _id: lga._id },
              {
                $set: {
                  slug,
                },
              }
            );
          }
        })
      );
    }
    return res.status(200).json({ message: "Done" });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = areasController;
