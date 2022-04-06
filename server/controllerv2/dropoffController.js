const {
  scheduleDropModel,
  dropOffModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
} = require("../models");
let dropoffController = {};

const { validationResult, body } = require("express-validator");

const bodyValidate = (req, res) => {
  // 1. Validate the request coming in
  // console.log(req.body);
  const result = validationResult(req);

  const hasErrors = !result.isEmpty();
  console.log(hasErrors);

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

dropoffController.dropOffs = async (req, res) => {
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
          { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { organisationPhone: { $regex: `.*${key}.*`, $options: "i" } },
          //{ quantity: key },
          { categories: { $in: [key] } },
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
        ],
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

    const totalResult = await scheduleDropModel.countDocuments(criteria);

    const dropoffs = await scheduleDropModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        dropoffs,
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

dropoffController.companydropOffs = async (req, res) => {
  try {
    const { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    const { companyName: organisation } = req.user;

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

    if (key) {
      criteria = {
        $or: [
          { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          { fullname: { $regex: `.*${key}.*`, $options: "i" } },
          { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
          { organisation: { $regex: `.*${key}.*`, $options: "i" } },
          { phone: { $regex: `.*${key}.*`, $options: "i" } },
          { organisationPhone: { $regex: `.*${key}.*`, $options: "i" } },
          // { quantity: key },
          { categories: { $in: [key] } },
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisation,
      };
    } else {
      const [startDate, endDate] = [new Date(start), new Date(end)];
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisation,
      };
    }

    console.log("c", criteria);
    if (state) criteria.state = state;

    const totalResult = await scheduleDropModel.countDocuments(criteria);

    const dropoffs = await scheduleDropModel
      .find(criteria)
      .sort({ createdAt: -1 })
      .skip((page - 1) * resultsPerPage)
      .limit(resultsPerPage);

    return res.status(200).json({
      error: false,
      message: "success",
      data: {
        dropoffs,
        totalResult,
        page,
        resultsPerPage,
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

dropoffController.deleteDropOff = async (req, res) => {
  const { dropOffId } = req.body;
  const { companyName: organisation } = req.user;
  try {
    const drop = await scheduleDropModel.findOneAndDelete({
      _id: dropOffId,
      organisation,
    });
    if (!drop)
      return res.status(404).json({
        error: true,
        message: "Drop-off schedule data couldn't be found",
      });

    return res.status(200).json({
      error: false,
      message: "Drop-off removed successfully!",
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

dropoffController.addDropOffLocation = async (req, res) => {
  const dropLocation = { ...req.body };
  try {
    const drop = await dropOffModel.create(dropLocation);
    return res.status(201).json({
      error: false,
      message: "Drop-off submitted successfully!",
      data: drop,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

dropoffController.rewardDropSystem = async (req, res) => {
  const collectorId = req.body.collectorId;
  const categories = req.body.categories;
  const scheduleId = req.body.scheduleId;
  try {
    const dropoffs = await scheduleDropModel.findById(scheduleId);
    if (!dropoffs) {
      return res.status(400).json({
        error: true,
        message: "Dropoff not found",
      });
    }

    const scheduler = await userModel.findOne({
      email: dropoffs.scheduleCreator,
    });

    if (!scheduler) {
      return res.status(400).json({
        error: true,
        message: "Invalid schedule, no user found under schedule",
      });
    }

    const alreadyCompleted = await transactionModel.findOne({
      scheduleId: dropoffs._id,
    });

    if (alreadyCompleted) {
      return res.status(400).json({
        error: true,
        message: "This transaction had been completed by another recycler",
      });
    }

    const collector = await collectorModel.findById(collectorId);
    if (!collector || collector.verified === false) {
      return res.status(400).json({
        error: true,
        message: "Collector not found or has not be verified",
      });
    }

    const organisation = await organisationModel.findById(collector.approvedBy);
    if (!organisation) {
      return res.status(400).json({
        error: true,
        message:
          "organisation not found or no longer exist, Please contact support",
      });
    }

    let pricing = [];
    let cat;

    console.log("organisation", organisation);
    console.log("categories", categories);
    for (let category of categories) {
      if (organisation.categories.length !== 0) {
        cat = organisation.categories.find(
          (c) => c.name.toLowerCase() === category.name
        );
        if (!cat) {
          return res.status(400).json({
            error: true,
            message: `${category.name} not found as a waste category for organisation`,
          });
        }
        const p = parseFloat(category.quantity) * Number(cat.price);
        console.log("quantity", parseFloat(category.quantity));
        pricing.push(p);
      } else {
        var cc =
          category.name === "nylonSachet"
            ? "nylon"
            : category.name === "glassBottle"
            ? "glass"
            : category.name.length < 4
            ? category.name.substring(0, category.name.length)
            : category.name.substring(0, category.name.length - 1);

        var organisationCheck = JSON.parse(JSON.stringify(organisation));
        console.log("organisation check here", organisationCheck);
        for (let val in organisationCheck) {
          console.log("category check here", cc);
          if (val.includes(cc)) {
            const equivalent = !!organisationCheck[val]
              ? organisationCheck[val]
              : 1;
            console.log("equivalent here", equivalent);
            const p = parseFloat(category.quantity) * equivalent;
            pricing.push(p);
          }
        }
      }
    }

    const totalpointGained = pricing.reduce((a, b) => {
      return a + b;
    }, 0);

    const totalWeight = categories.reduce((a, b) => {
      return a + (b["quantity"] || 0);
    }, 0);
    console.log("pricing", pricing);

    await transactionModel.create({
      weight: totalWeight,
      coin: totalpointGained,
      cardID: scheduler._id,
      completedBy: collectorId,
      categories,
      fullname: `${scheduler.firstname} ${scheduler.lastname}`,
      recycler: collector.fullname,
      aggregatorId: collector.aggregatorId,
      organisation: collector.organisation,
      organisation: organisation._id,
      scheduleId: schedule._id,
      type: "pickup schedule",
    });

    const message = {
      app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
      contents: {
        en: "Your schedule drop off has been completed successfully. You have received the equivalent amount in your wallet",
      },
      include_player_ids: [`${scheduler.onesignal_id}`],
    };

    sendNotification(message);

    await schedule.updateOne(
      { _id: schedule._id },
      {
        $set: {
          completionStatus: "completed",
          collectedBy: collectorId,
          quantity: totalWeight,
          completionDate: new Date(),
        },
      }
    );

    await userModel.updateOne(
      { email: scheduler.email },
      {
        $set: {
          availablePoints: scheduler.availablePoints + totalpointGained,
          schedulePoints: scheduler.schedulePoints + 1,
        },
      }
    );

    await collectorModel.updateOne(
      { _id: collector._id },
      {
        $set: {
          totalCollected: collector.totalCollected + totalWeight,
          numberOfTripsCompleted: collector.numberOfTripsCompleted + 1,
          busy: false,
          last_logged_in: new Date(),
        },
      }
    );
    return res.status(200).json({
      error: false,
      message: "Transaction completed successfully",
      //data: totalpointGained,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

module.exports = dropoffController;
