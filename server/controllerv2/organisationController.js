"use strict";

let organisationController = {};
const {
  organisationModel,
  transactionModel,
  geofenceModel,
} = require("../models");
const {
  sendResponse,
  bodyValidate,
  encryptPassword,
  generateRandomString,
} = require("../util/commonFunction");
const sgMail = require("@sendgrid/mail");
const request = require("request");

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

    //console.log("c", criteria);
    const skip = (page - 1) * resultsPerPage;
    const limit = skip + resultsPerPage;

    const totalResult = await transactionModel.countDocuments(criteria);
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

    //console.log("d", d);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        result: d,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
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
        ],
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    }

    if (state) criteria.state = state;

    const totalResult = await organisationModel.countDocuments(criteria);
    const organisations = await organisationModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        organisations,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
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

organisationController.create = async (req, res) => {
  bodyValidate(req, res);
  try {
    const body = req.body;
    const check = await organisationModel.findOne({
      $or: [
        { companyName: body.companyName },
        { email: body.email },
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

    const password = generateRandomString();
    body.password = await encryptPassword(password);
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

Kindly use the following login details to sign in to your  Pakam Company Dashboard.


Email: ${org.email}

Password: ${password}

Please note you can reset the password after logging into the App by clicking on the image icon on the top right corner of the screen.

*Attached below is a guide on how to use the Company Dashboard.

How To Use The Dashboard
Kindly Logon to https://dashboard.pakam.ng

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
    areas.map((area) => {
      request.get(
        {
          url: `https://maps.googleapis.com/maps/api/geocode/json?address=${area}&key=AIzaSyBGv53NEoMm3uPyA9U45ibSl3pOlqkHWN8`,
        },
        function (error, response, body) {
          const result = JSON.parse(body);
          const LatLong = result.results.map((a) => ({
            formatted_address: a.formatted_address,
            geometry: a.geometry,
          }));
          geofenceModel.create({
            organisationId: org._id,
            data: LatLong,
          });
        }
      );
    });
    delete org.password;
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
    const organisation = await organisationModel.findById(
      req.params.organisationId,
      { password: 0 }
    );
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

// organisationController.update = async (req, res) => {
//   bodyValidate(req, res);
// }

module.exports = organisationController;
