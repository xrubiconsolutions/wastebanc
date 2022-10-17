"use strict";

let organisationController = {};
const {
  organisationModel,
  organisationLogModel,
  organisationTypeModel,
  transactionModel,
  geofenceModel,
  collectorBinModel,
  organisationBinModel,
  dropOffModel,
  localGovernmentModel,
  systemChargesModel,
  scheduleModel,
  scheduleDropModel,
} = require("../models");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  generateRandomString,
  comparePassword,
} = require("../util/commonFunction");
const sgMail = require("@sendgrid/mail");
const request = require("request");
let dbConfig = require("../../server/config/dbConfig");
const db = require("../../bin/dbConnection.js");
const collectorModel = require("../models/collectorModel");
const rewardService = require("../services/rewardService");
const sterlingService = require("../modules/partners/sterling/sterlingService");
const ObjectId = require("mongoose").Types.ObjectId;
const categoriesModel = require("../models/categoryModel");
const axios = require("axios");
organisationController.types = async (req, res) => {
  try {
    const types = await organisationTypeModel
      .find({
        name: {
          $ne: "individual",
        },
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({
      error: false,
      message: "success",
      data: types,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.createtype = async (req, res) => {
  bodyValidate(req, res);
  try {
    const checkName = await organisationTypeModel.findOne({
      name: req.body.name,
    });
    if (checkName) {
      return res.status(400).json({
        error: true,
        message: "Name already exist",
      });
    }

    const store = await organisationTypeModel.create({
      name: req.body.name,
    });

    return res.status(200).json({
      error: false,
      message: "success",
      data: store,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};
organisationController.getOrganisationCompleted = async (req, res) => {
  try {
    let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (!key) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
    }

    let criteria;
    if (key) {
      criteria = {
        $or: [{ organisation: { $regex: `.*${key}.*`, $options: "i" } }],
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    }

    if (state) criteria.state = state;

    console.log("c", criteria);
    const skip = (page - 1) * resultsPerPage;
    const limit = skip + resultsPerPage;

    const totalResult = await transactionModel.aggregate([
      {
        $match: criteria,
      },
      {
        $group: { _id: "$organisation", total: { $sum: "$weight" } },
      },
    ]);
    const d = await transactionModel.aggregate([
      {
        $match: criteria,
      },
      {
        $group: { _id: "$organisation", total: { $sum: "$weight" } },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $skip: skip,
      },
    ]);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        result: d,
        totalResult: totalResult.length,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult.length / resultsPerPage),
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

organisationController.listOrganisation = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      key,
      allowPickers,
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);
    if (allowPickers) allowPickers = allowPickers === "true" ? true : false;

    // if (!key) {
    //   if (!start || !end) {
    //     return res.status(400).json({
    //       error: true,
    //       message: "Please pass a start and end date",
    //     });
    //   }
    // }

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }

    let criteria;

    if (key) {
      criteria = {
        $or: [
          { companyName: { $regex: `.*${key}.*`, $options: "i" } },
          {
            email: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            companyTag: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            areaOfAccess: { $regex: `.*${key}.*`, $options: "i" },
          },
          {
            streetOfAccess: { $regex: `.*${key}.*`, $options: "i" },
          },
          { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    } else {
      criteria = {};
    }

    //if (state) criteria.state = state;
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
    let pickerCriteria = {};
    if (typeof allowPickers === "boolean") {
      criteria.allowPickers = allowPickers;
      pickerCriteria = { allowPickers };
    }
    const totalResult = await organisationModel.countDocuments(criteria);

    const organisations =
      !key && !(start || end)
        ? await organisationModel
            .find(pickerCriteria, { password: 0 })
            .populate("categories.catId")
            .sort({ createAt: -1 })
            .skip((page - 1) * resultsPerPage)
            .limit(resultsPerPage)
        : await organisationModel
            .find(criteria, { password: 0 })
            .populate("categories.catId")
            .sort({ createAt: -1 })
            .skip((page - 1) * resultsPerPage)
            .limit(resultsPerPage);

    const data = {
      organisations,
      totalResult,
      page,
      resultsPerPage,
      totalPages: Math.ceil(totalResult / resultsPerPage),
    };

    return res.status(200).json({
      error: false,
      message: "success",
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.create = async (req, res) => {
  try {
    const body = req.body;
    const email = body.email.trim();

    const check = await organisationModel.findOne({
      $or: [
        { companyName: body.companyName },
        { email: email },
        { rcNo: body.rcNo },
        { companyTag: body.companyTag },
        { phone: body.phone },
      ],
    });

    if (check) {
      return res.status(400).json({
        error: true,
        message: "Company already exist",
      });
    }

    let categories = [];

    await Promise.all(
      body.categories.map(async (category) => {
        const catDetail = await categoriesModel.findOne({
          $or: [{ name: category.name }, { value: category.name }],
        });

        if (catDetail) {
          const value = {
            price: category.price,
            name: category.name,
            catId: catDetail._id,
          };
          categories.push(value);
        }
      })
    );

    if (categories.length == 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid Categories values passed",
        data: req.body.categories,
      });
    }

    const password = generateRandomString();
    body.password = await encryptPassword(password);
    body.email = email.toLowerCase();
    body.phone = body.phone;
    body.categories = categories;
    const org = await organisationModel.create(body);
    sgMail.setApiKey(
      "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"
    );

    const msg = {
      to: `${org.email}`,
      from: "pakam@xrubiconsolutions.com", // Use the email address or domain you verified above
      subject: "WELCOME TO PAKAM!!!",
      text: `
Congratulations, you have been approved by Pakam and have been on-boarded to the Pakam waste management ecosystem.

Kindly use the following login details to sign in to your Pakam Company Dashboard.


Email: ${org.email}

Password: ${password}

Please note you can reset the password after logging into the App by clicking on the image icon on the top right corner of the screen.

*Attached below is a guide on how to use the Company Dashboard.

How To Use The Dashboard
Kindly Logon to https://newdashboard.pakam.ng

* Select Recycling Company
* Input your Login Details
* You can reset your password by clicking on the image icon at the top right of the screen.
* After Login you can see a data representation of all activities pertaining to your organisation such as:
Total Schedule Pickup: This is the sum total of the schedules within your jurisdiction, which include pending schedules, completed schedules, accepted schedules, cancelled schedules and missed schedules.

Total Waste Collected: This card display the data of all the waste collected by your organization so far. When you click on the card it shows you a data table representing the actual data of the waste collected by your organization and it's aggregators.

Total Payout: This card embodies the table that showcase details of user whose recyclables your organization have collected and how much you are meant to pay them.

Instruction of How To Onboard Collectors or Aggregators

* You will need to onboard your collectors or aggregators into the system by asking them to download the Pakam Recycler's App.
* Create a unique company ID No for your collector/aggregator.
* Instruct them to select the name of your organization and input unique company ID No while setting up their account.
* Once they choose your organization as their recycling company, you will need to approve them on your company Dashboard.

How To Approve a Collector/Aggregator
* Login  into your Company Dashboard
* Click on all aggregator on the side menu
* Click on all pending aggregator
* You will see a list of all pending aggregator and an approve button beside it. 
* Click on approve to Approve the aggregator
* Refresh the screen, pending aggregators who have been approved will populated under All Approved aggregators.

We wish you an awesome experience using the App waste management software.

Best Regards

Pakam Team
`,
    };

    await sgMail.send(msg);

    const areas = org.areaOfAccess;
    if (areas.length > 0) {
      await Promise.all(
        areas.map(async (area) => {
          const lcd = await localGovernmentModel.findOne({
            $or: [{ slug: area }, { lcd: area }],
          });
          if (lcd) {
            const result = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${lcd.lcd}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`
            );
            const data = result.data.results;

            console.log("result", data);

            await geofenceModel.create({
              organisationId: org._id,
              data: result.data.results,
            });
          }
        })
      );
    }

    delete org.password;

    // add action to log
    organisationController.addLog("create", req.body, org._id, req.user._id);

    return res.status(200).json({
      error: false,
      message: "success",
      data: org,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.findOrganisation = async (req, res) => {
  bodyValidate(req, res);
  try {
    const organisation = await organisationModel
      .findById(req.params.organisationId, { password: 0 })
      .populate("categories.catId");
    if (!organisation) {
      return res.status(400).json({
        error: true,
        message: "Organisation not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Organisation found",
      data: organisation,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.update = async (req, res) => {
  try {
    const orgId = req.params.orgId;
    if (!ObjectId.isValid(orgId))
      return res.status(422).json({
        error: true,
        message: "Organisation id is invalid",
      });

    const organisation = await organisationModel.findOne({
      _id: orgId,
    });

    if (!organisation) {
      return res.status(400).json({
        error: true,
        message: "Organisation does to exist",
      });
    }

    const organisations = await organisationModel.find({
      $or: [
        { email: req.body.email || "" },
        {
          companyName: req.body.companyName || "",
        },
      ],
    });

    if (organisations.length !== 0) {
      if (req.body.email) {
        const checkemail = organisations.find(
          (org) => org.email.toLowerCase() === req.body.email.toLowerCase()
        );
        if (
          checkemail &&
          checkemail._id.toString() !== organisation._id.toString()
        ) {
          return res.status(400).json({
            error: true,
            message: "Email already exist",
          });
        }
      }

      if (req.body.companyName) {
        const checkcompanyName = organisations.find(
          (org) =>
            org.companyName.toLowerCase() === req.body.companyName.toLowerCase()
        );
        if (
          checkcompanyName &&
          checkcompanyName._id.toString() !== organisation._id.toString()
        ) {
          return res.status(400).json({
            error: true,
            message: "company name already exist",
          });
        }
      }
    }

    let allowPickers = organisation.allowPickers;
    if (typeof req.body.allowPickers) {
      allowPickers = req.body.allowPickers;
    }

    let categories = [];
    if (req.body.categories) {
      await Promise.all(
        req.body.categories.map(async (category) => {
          const catDetail = await categoriesModel.findOne({
            $or: [{ name: category.name }, { value: category.name }],
          });

          if (catDetail) {
            const value = {
              price: category.price,
              name: category.name,
              catId: catDetail._id,
            };
            categories.push(value);
          }
        })
      );

      if (categories.length == 0) {
        return res.status(400).json({
          error: true,
          message: "Invalid Categories values passed",
          data: req.body.categories,
        });
      }
    } else {
      categories = organisation.categories;
    }

    await organisationModel.updateOne(
      { _id: organisation._id },
      {
        email: req.body.email || organisation.email,
        areaOfAccess: req.body.areaOfAccess || organisation.areaOfAccess,
        companyName: req.body.companyName || organisation.companyName,
        rcNo: req.body.rcNo || organisation.rcNo,
        companyTag: req.body.companyTag || organisation.companyTag,
        phone: req.body.phone || organisation.phone,
        streetOfAccess: req.body.streetOfAccess || organisation.streetOfAccess,
        categories: categories,
        location: req.body.location || organisation.location,
        allowPickers,
      }
    );

    if (req.body.areaOfAccess) {
      await geofenceModel.deleteMany({ organisationId: organisation._id });
      await Promise.all(
        req.body.areaOfAccess.map(async (area) => {
          const lcd = await localGovernmentModel.findOne({
            $or: [{ slug: area }, { lcd: area }],
          });
          console.log("lcd", area);

          if (lcd) {
            const result = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${lcd.lcd}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`
            );
            const data = result.data.results;

            console.log("result", data);

            await geofenceModel.create({
              organisationId: organisation._id,
              data: result.data.results,
            });
          }
        })
      );
    }

    organisation.email = req.body.email || organisation.email;
    organisation.areaOfAccess =
      req.body.areaOfAccess || organisation.areaOfAccess;
    organisation.companyName = req.body.companyName || organisation.companyName;
    organisation.rcNo = req.body.rcNo || organisation.rcNo;
    organisation.companyTag = req.body.companyTag || organisation.companyTag;
    organisation.phone = req.body.phone || organisation.phone;
    organisation.streetOfAccess =
      req.body.streetOfAccess || organisation.streetOfAccess;
    organisation.categories = categories;
    organisation.location = req.body.location || organisation.location;
    organisation.allowPickers = allowPickers;

    // add action to log
    organisationController.addLog(
      "update",
      req.body,
      organisation._id,
      req.user._id
    );

    return res.status(200).json({
      error: false,
      message: "organisation updated successfully",
      data: organisation,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.aggregators = async (req, res) => {
  // bodyValidate(req, res);
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
    const { organisation } = req.params;
    if (!organisation)
      res.status(422).json({
        error: true,
        message: "Organisation id is required",
      });
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    console.log({ organisation });
    const org = await organisationModel.findById(organisation);
    if (!org) {
      res.status(400).json({
        error: true,
        message: "Organisation not found",
      });
    }

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { gender: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { email: { $regex: `.*${key}.*`, $options: "i" } },
          { localGovernment: { $regex: `.*${key}.*`, $options: "i" } },
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          // { IDNumber: key },
        ],
        approvedBy: org._id.toString(),
      };
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        //organisation: org.companyName,
        approvedBy: org._id.toString(),
      };
    } else {
      criteria = {
        //organisation: org.companyName,
        approvedBy: org._id.toString(),
      };
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }
    const totalResult = await collectorModel.countDocuments(criteria);
    const projection = {
      roles: 0,
      password: 0,
    };

    const collectors = await collectorModel
      .find(criteria, projection, { lean: true })
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        collectors,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      },
    });
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.remove = async (req, res) => {
  bodyValidate(req, res);

  const { orgId } = req.params;
  const organisation = await organisationModel.findById(orgId);
  if (!organisation) {
    return res.status(400).json({
      error: true,
      message: "Organisation not found",
    });
  }

  const collectors = await collectorModel.find({
    organisation: organisation.companyName,
  });

  try {
    if (collectors.length !== 0) {
      const insertMany = await collectorBinModel.insertMany(collectors);
      console.log("insertMany", insertMany);
      if (insertMany) {
        await collectorModel.deleteMany({
          organisation: organisation.companyName,
        });
      }
    }

    const insert = await organisationBinModel.create({
      companyName: organisation.companyName,
      email: organisation.email,
      password: organisation.password,
      rcNo: organisation.rcNo,
      companyTag: organisation.companyTag,
      phone: organisation.phone,
      roles: organisation.roles,
      role: organisation.role,
      license_active: organisation.license_active,
      expiry_date: organisation.expiry_date,
      totalAvailable: organisation.totalAvailable,
      totalSpent: organisation.totalSpent,
      resetToken: organisation.resetToken,
      location: organisation.location,
      areaOfAccess: organisation.areaOfAccess,
      streetOfAccess: organisation.streetOfAccess,
      categories: organisation.categories,
      canEquivalent: organisation.canEquivalent,
      cartonEquivalent: organisation.cartonEquivalent,
      petBottleEquivalent: organisation.petBottleEquivalent,
      rubberEquivalent: organisation.rubberEquivalent,
      plasticEquivalent: organisation.plasticEquivalent,
      woodEquivalent: organisation.woodEquivalent,
      glassEquivalent: organisation.glassEquivalent,
      nylonEquivalent: organisation.nylonEquivalent,
      metalEquivalent: organisation.metalEquivalent,
      eWasteEquivalent: organisation.eWasteEquivalent,
      tyreEquivalent: organisation.tyreEquivalent,
      wallet: organisation.wallet,
    });

    console.log("insert", insert);
    if (insert) {
      await organisationModel.deleteOne({
        _id: organisation._id,
      });
    }

    // add action to log
    organisationController.addLog(
      "delete",
      null,
      organisation._id,
      req.user._id
    );
    return res.status(200).json({
      error: false,
      message: "Organisation deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.updateProfile = async (req, res) => {
  bodyValidate(req, res);
  const organisation = req.user;
  try {
    const organisations = await organisationModel.find({
      $or: [
        { email: req.body.email || "" },
        {
          companyName: req.body.companyName || "",
        },
      ],
    });

    if (organisations.length !== 0) {
      if (req.body.email) {
        const checkemail = organisations.find(
          (org) => org.email.toLowerCase() === req.body.email.toLowerCase()
        );
        if (
          checkemail &&
          checkemail._id.toString() !== organisation._id.toString()
        ) {
          return res.status(400).json({
            error: true,
            message: "Email already exist",
          });
        }
      }

      if (req.body.companyName) {
        const checkcompanyName = organisations.find(
          (org) =>
            org.companyName.toLowerCase() === req.body.companyName.toLowerCase()
        );
        if (
          checkcompanyName &&
          checkcompanyName._id.toString() !== organisation._id.toString()
        ) {
          return res.status(400).json({
            error: true,
            message: "company name already exist",
          });
        }
      }
    }

    let categories = [];
    if (req.body.categories) {
      await Promise.all(
        req.body.categories.map(async (category) => {
          const catDetail = await categoriesModel.findOne({
            $or: [{ name: category.name }, { value: category.name }],
          });

          if (catDetail) {
            const value = {
              price: category.price,
              name: category.name,
              catId: catDetail._id,
            };
            categories.push(value);
          }
        })
      );

      if (categories.length == 0) {
        return res.status(400).json({
          error: true,
          message: "Invalid Categories values passed",
          data: req.body.categories,
        });
      }
    } else {
      categories = organisation.categories;
    }

    let allowPickers = organisation.allowPickers;
    if (typeof req.body.allowPickers) {
      allowPickers = req.body.allowPickers;
    }

    await organisationModel.updateOne(
      { _id: organisation._id },
      {
        email: req.body.email || organisation.email,
        areaOfAccess: req.body.areaOfAccess || organisation.areaOfAccess,
        companyName: req.body.companyName || organisation.companyName,
        rcNo: req.body.rcNo || organisation.rcNo,
        companyTag: req.body.companyTag || organisation.companyTag,
        phone: req.body.phone || organisation.phone,
        streetOfAccess: req.body.streetOfAccess || organisation.streetOfAccess,
        categories,
        location: req.body.location || organisation.location,
        allowPickers,
      }
    );

    if (req.body.areaOfAccess) {
      await geofenceModel.deleteMany({ organisationId: organisation._id });
      await Promise.all(
        req.body.areaOfAccess.map(async (area) => {
          const lcd = await localGovernmentModel.findOne({
            $or: [{ slug: area }, { lcd: area }],
          });

          if (lcd) {
            const result = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${lcd.lcd}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`
            );
            const data = result.data.results;

            await geofenceModel.create({
              organisationId: organisation._id,
              data: result.data.results,
            });
          }
        })
      );
    }

    organisation.email = req.body.email || organisation.email;
    organisation.areaOfAccess =
      req.body.areaOfAccess || organisation.areaOfAccess;
    organisation.companyName = req.body.companyName || organisation.companyName;
    organisation.rcNo = req.body.rcNo || organisation.rcNo;
    organisation.companyTag = req.body.companyTag || organisation.companyTag;
    organisation.phone = req.body.phone || organisation.phone;
    organisation.streetOfAccess =
      req.body.streetOfAccess || organisation.streetOfAccess;
    organisation.categories = categories;
    organisation.location = req.body.location || organisation.location;
    organisation.allowPickers = allowPickers;

    // add action to log
    organisationController.addLog(
      "profile_update",
      req.body,
      organisation._id,
      req.user._id
    );
    const resultData = { ...organisation.toJSON() };
    delete resultData.password;

    return res.status(200).json({
      error: false,
      message: "organisation updated successfully",
      data: resultData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

organisationController.dropOffPakam = async (req, res) => {
  try {
    let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { "location.address": { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };
    } else if (start && end) {
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

    if (state) criteria.state = state;
    const totalResults = await dropOffModel.countDocuments(criteria);
    const drops = await dropOffModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        drops,
        totalResult: totalResults,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResults / resultsPerPage),
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

organisationController.disableCompany = async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await organisationModel.findById(companyId);

    // return error if company is not found
    if (!company)
      return res.status(404).json({
        error: true,
        message: "Company account not found!",
      });

    // return if account is already disabled
    if (company.isDisabled)
      return res.status(200).json({
        error: false,
        message: "Company account already disabled!",
      });

    // disable company account
    company.isDisabled = true;
    await company.save();

    // disable all collectors account within organisation
    await collectorModel.updateMany(
      {
        organisationID: company._id.toString(),
      },
      { status: "disabled" }
    );

    // add action to log
    organisationController.addLog("disable", null, companyId, req.user._id);

    // return success response
    return res.status(200).json({
      error: false,
      message: "Company disabled successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.enableCompany = async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await organisationModel.findById(companyId);

    // return error if company is not found
    if (!company)
      return res.status(404).json({
        error: true,
        message: "Company account not found!",
      });

    // return if account is already disabled
    if (!company.isDisabled)
      return res.status(200).json({
        error: false,
        message: "Company account already enabled!",
      });

    // enable company account
    company.isDisabled = false;
    await company.save();

    // disable all collectors account within organisation
    await collectorModel.updateMany(
      {
        organisation: company.companyName,
      },
      { status: "active" }
    );

    // add action to log
    organisationController.addLog("enable", null, companyId, req.user._id);

    // return success response
    return res.status(200).json({
      error: false,
      message: "Company enabled successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.changePassword = async (req, res) => {
  const { _id: companyId, password } = req.user;
  const { currentPassword, newPassword } = req.body;
  try {
    // return error if passwords don't match
    const passwordMatch = await comparePassword(currentPassword, password);
    if (!passwordMatch)
      return res.status(400).json({
        error: true,
        message: "Current password is incorrect!",
      });

    // update account with new password
    const passwordHash = await encryptPassword(newPassword);
    const account = await organisationModel.findById(companyId);
    account.password = passwordHash;
    account.firstLogin = false;
    await account.save();

    // add action to log
    organisationController.addLog(
      "change_password",
      { currentPassword, newPassword },
      companyId,
      req.user._id
    );

    // return success message
    return res.status(200).json({
      error: false,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.allowsPickers = async (req, res) => {
  try {
    const organisations = await organisationModel.findOne({
      allowPickers: true,
    });

    return res.status(200).json({
      error: false,
      message: "success",
      data: organisations,
    });
  } catch (error) {
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.estimatedCost = async (req, res) => {
  try {
    const { user } = req;
    const sumData = await transactionModel.find({
      organisationID: user._id.toString(),
      organisationPaid: false,
    });

    console.log("t", sumData);

    let houseHoldTotalCoins = 0;
    let wastePickerTotalCoins = 0;
    sumData.forEach((e) => {
      houseHoldTotalCoins += e.coin;
    });

    sumData.forEach((e) => {
      wastePickerTotalCoins += e.wastePickerCoin;
    });
    const sumTotal = houseHoldTotalCoins + wastePickerTotalCoins;

    const sumPercentage = rewardService.calPercentage(
      sumTotal,
      user.systemCharge
    );

    const sum = sumTotal + sumPercentage;

    return res.status(200).json({
      error: false,
      message: "",
      data: sum,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.ongoingbilling = async (req, res) => {
  try {
    const { user } = req;
    const transactions = await transactionModel.find({
      organisationID: user._id.toString(),
      organisationPaid: false,
    });

    let start = "",
      end = "",
      percentage = 0,
      subtotal = 0,
      total = 0,
      household = 0,
      wastePickersTotal = 0;
    if (transactions.length > 0) {
      // get the highest createdAt and lowest created At
      let arr = [];
      transactions.map((d) => {
        arr.push(d.createdAt);
      });
      transactions.forEach((e) => {
        household += e.coin;
      });

      transactions.forEach((e) => {
        wastePickersTotal += e.wastePickerCoin;
      });

      subtotal = household + wastePickersTotal;
      if (subtotal > 0) {
        percentage = rewardService.calPercentage(subtotal, user.systemCharge);
        total = subtotal + percentage;
      }

      end = new Date(Math.max(...arr));
      start = new Date(Math.min(...arr));

      start.toUTCString().split(" ").slice(0, 3).join(" ");
      end.toUTCString().split(" ").slice(0, 4).join(" ");
    }

    // billing
    return res.status(200).json({
      error: false,
      message: "Company Billing data",
      data: {
        startMonth: start,
        endMonth: end,
        transactions,
        household,
        wastePickersTotal,
        subtotal: subtotal.toFixed(2),
        serviceCharge: percentage.toFixed(2),
        total: total.toFixed(2),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.completedSchedule = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;

    if (!currentScope) {
      return res.status(400).json({
        error: true,
        message: "Invalid request",
      });
    }

    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      key,
      type = "pickup",
    } = req.query;
    const { companyId } = req.params;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    let criteria;
    if (key) {
      criteria = {
        $or: [
          { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          { address: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisationCollection: companyId,
        completionStatus: "completed",
      };
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisationCollection: companyId,
        completionStatus: "completed",
      };
    } else {
      criteria = {
        ///$and: [{ organisationCollection: companyId }],
        organisationCollection: companyId,
        completionStatus: "completed",
      };
    }

    if (currentScope === "All") {
      criteria.state = {
        $in: user.states,
      };
    } else {
      criteria.state = currentScope;
    }

    const skip = (page - 1) * resultsPerPage;

    console.log("criteria", criteria);

    const aggregators = [
      {
        $project: {
          newId: {
            $toString: "$_id",
          },
          clientId: {
            $toObjectId: "$clientId",
          },
          completionStatus: 1,
          collectedBy: { $toObjectId: "$collectedBy" },
          organisationCollection: 1,
          createdAt: 1,
          state: 1,
          scheduleCreator: 1,
          address: 1,
          phone: 1,
          createdAt: 1,
        },
      },
      {
        $match: criteria,
      },
      {
        $lookup: {
          from: "transactions",
          let: { pickupId: "$newId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$scheduleId", "$$pickupId"] }],
                },
              },
            },
            {
              $project: {
                categories: 1,
                weight: 1,
                coin: 1,
                type: 1,
                paymentResolution: 1,
                createdAt: 1,
              },
            },
          ],
          as: "transaction",
        },
      },
      {
        $unwind: {
          path: "$transaction",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$clientId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$userId"],
                    },
                  ],
                },
              },
            },
            {
              $project: { username: 1, phone: 1 },
            },
          ],
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "collectors",
          let: { collectorId: "$collectedBy" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$collectorId"],
                    },
                  ],
                },
              },
            },
            {
              $project: { fullname: 1, gender: 1 },
            },
          ],
          as: "collector",
        },
      },
      {
        $unwind: {
          path: "$collector",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $limit: resultsPerPage,
      },
      {
        $skip: skip,
      },
    ];
    let schedules, totalResult;

    if (type == "dropoff") {
      schedules = await scheduleDropModel.aggregate(aggregators);
      totalResult = await scheduleDropModel.countDocuments(criteria);
    } else {
      schedules = await scheduleModel.aggregate(aggregators);
      totalResult = await scheduleModel.countDocuments(criteria);
    }
    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        schedules,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.accountDetails = async (req, res) => {
  try {
    const sterlingAccount = await sterlingService.bankDetails();
    return res.status(200).json(sterlingAccount);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.addLog = async (
  action = "",
  data = "",
  organisationId,
  actionBy = ""
) => {
  try {
    const log = await organisationLogModel.create({
      action,
      data,
      organisation: organisationId,
      actionBy,
    });
    return true;
  } catch (err) {
    console.log({ err });
    return false;
  }
};

organisationController.profile = async (req, res) => {
  try {
    const { user } = req;

    const companyDetail = await organisationModel
      .findById(user._id, {
        password: 0,
        roles: 0,
        role: 0,
        totalAvailable: 0,
        totalSpent: 0,
        resetToken: 0,
      })
      .populate("categories.catId");

    return res.status(200).json({
      error: false,
      message: "Company Details",
      data: companyDetail,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      message: "An error occured!",
    });
  }
};

organisationController.updateStreetOfAccess = async (req, res) => {
  const result = await organisationModel.updateOne(
    { companyName:req.body.companyName },
    {
      streetOfAccess: req.body.streetOfAccess
    }
  );
  console.log("re", result);
  return res.status(200).json(result)
};

organisationController.addcategories = async (req, res) => {
  const result = await organisationModel.updateOne(
    { companyName: req.body.companyName },
    { $set: { categories: req.body.categories } }
  );
  console.log('res', result);
  return res.status(200).json(result)
};

module.exports = organisationController;
