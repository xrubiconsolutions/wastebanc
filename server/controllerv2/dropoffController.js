const {
  scheduleDropModel,
  dropOffModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
  activitesModel,
} = require("../models");
let dropoffController = {};
const moment = require("moment-timezone");
const { sendNotification } = require("../util/commonFunction");
const randomstring = require("randomstring");
const rewardService = require("../services/rewardService");
moment().tz("Africa/Lagos", false);

dropoffController.aggregateQuery = async ({
  criteria,
  page = 1,
  resultsPerPage = 20,
}) => {
  try {
    const paginationQuery = [
      {
        $skip: (page - 1) * resultsPerPage,
      },
      {
        $limit: resultsPerPage,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];
    const pipeline = [
      {
        $match: criteria,
      },
      {
        $lookup: {
          from: "users",
          let: {
            email: "$scheduleCreator",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$email", "$$email"],
                },
              },
            },
            {
              $project: {
                fullname: 1,
                userId: "$_id",
                _id: 0,
              },
            },
          ],
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          fullname: {
            $ifNull: ["$customer.fullname", "$fullname"],
          },
          clientId: {
            $ifNull: ["$customer.userId", "$clientId"],
          },
          scheduleCreator: 1,
          categories: 1,
          quantity: 1,
          completionStatus: 1,
          organisation: 1,
          createdAt: 1,
          organisationCollection: 1,
          organisationPhone: 1,
          dropOffDate: 1,
          expiryDuration: 1,
          state: 1,
          collectedBy: 1,
        },
      },
    ];

    const countCriteria = [
      ...pipeline,
      {
        $count: "scheduleCreator",
      },
    ];
    let totalResult = await scheduleDropModel.aggregate(countCriteria);

    const dropoffs = await scheduleDropModel.aggregate([
      ...pipeline,
      ...paginationQuery,
    ]);

    return { dropoffs, totalResult: Object.values(totalResult[0])[0] };
  } catch (error) {
    throw error;
  }
};

dropoffController.dropOffs = async (req, res) => {
  try {
    const { user } = req;
    const currentScope = user.locationScope;
    let { page = 1, resultsPerPage = 20, start, end, key } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }
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
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
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

    console.log("criteria", criteria);

    // const totalResult = await scheduleDropModel.countDocuments(criteria);

    const { dropoffs, totalResult } = await dropoffController.aggregateQuery({
      criteria,
      page,
      resultsPerPage,
    });

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
    let { page = 1, resultsPerPage = 20, start, end, state, key } = req.query;
    const { companyName: organisation } = req.user;

    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (start || end) {
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({
          error: true,
          message: "Start date cannot be greater than end date",
        });
      }
    }
    // if (!key) {
    //   if (!start || !end) {
    //     return res.status(400).json({
    //       error: true,
    //       message: "Please pass a start and end date",
    //     });
    //   }
    // }

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
    } else if (start || end) {
      if (!start || !end) {
        return res.status(400).json({
          error: true,
          message: "Please pass a start and end date",
        });
      }
      const [startDate, endDate] = [new Date(start), new Date(end)];
      endDate.setDate(endDate.getDate() + 1);
      criteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        organisation,
      };
    } else {
      criteria = {
        organisation,
      };
    }

    console.log("c", criteria);
    if (state) criteria.state = state;

    const { dropoffs, totalResult } = await dropoffController.aggregateQuery({
      criteria,
      page,
      resultsPerPage,
    });

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

dropoffController.removeDropLocation = async (req, res) => {
  try {
    const { user } = req;
    const { dropOffId } = req.body;
    const drop = await dropOffModel.findOneAndDelete({
      _id: dropOffId,
      organisationId: user._id,
    });

    if (!drop) {
      return res.status(400).json({
        error: true,
        message: "Drop off location not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Drop off location deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dropoffController.rewardDropSystem = async (req, res) => {
  const collectorId = req.body.collectorId;
  const categories = req.body.categories;
  const scheduleId = req.body.scheduleId;
  try {
    const alreadyCompleted = await transactionModel.findOne({
      scheduleId,
    });
    if (alreadyCompleted) {
      return res.status(400).json({
        error: true,
        message: "This transaction had been completed by another recycler",
      });
    }

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
      console.log("category", category.name.toLowerCase());
      console.log("org cat", organisation.categories);
      if (organisation.categories.length !== 0) {
        const c = organisation.categories.find(
          (cc) => cc.name.toLowerCase() === category.name.toLowerCase()
        );

        if (c) {
          console.log("cat", cc);
          const p = parseFloat(category.quantity) * Number(c.price);
          console.log("quantity", parseFloat(category.quantity));
          pricing.push(p);
        }
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
      return parseFloat(a) + parseFloat(b);
    }, 0);

    const totalWeight = categories.reduce((a, b) => {
      return parseFloat(a) + (parseFloat(b["quantity"]) || 0);
    }, 0);
    console.log("pricing", pricing);

    const pakamPercentage = rewardService.calPercentage(
      householdReward.totalpointGained,
      10
    );
    const ref = randomstring.generate({
      length: 7,
      charset: "numeric",
    });
    const t = await transactionModel.create({
      weight: totalWeight,
      coin: Number(totalpointGained) - Number(pakamPercentage),
      cardID: scheduler._id,
      completedBy: collectorId,
      categories,
      fullname: `${scheduler.firstname} ${scheduler.lastname}`,
      recycler: collector.fullname,
      aggregatorId: collector.aggregatorId,
      organisation: collector.organisation,
      organisationID: organisation._id,
      scheduleId,
      type: "dropoff",
      state: scheduler.state || "",
      ref_id: ref,
      percentage: pakamPercentage,
      address: dropoffs.address,
    });

    const message = {
      app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
      contents: {
        en: `You have just been credited ${t.coin} for your drop off`,
      },
      channel_for_external_user_ids: "push",
      include_external_user_ids: [scheduler.onesignal_id],
      //include_player_ids: [`${scheduler.onesignal_id}`],
    };

    await notificationModel.create({
      title: "Dropoff Schedule completed",
      lcd: scheduler.lcd,
      message: `You have just been credited ${t.coin} for your drop off`,
      schedulerId: scheduler._id,
    });

    sendNotification(message);

    await scheduleDropModel.updateOne(
      { _id: dropoffs._id },
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
          availablePoints: scheduler.availablePoints + t.coin,
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

    // store the user activity for both scheduler and collector
    // collector
    await activitesModel.create({
      userId: collector._id,
      message: `Dropoff completed. Reference ID: ${t.ref_id}`,
      activity_type: "dropoff",
    });

    //scheduler
    await activitesModel.create({
      userType: "client",
      userId: scheduler._id,
      message: `Dropoff completed. Reference ID: ${t.ref_id}`,
      activity_type: "dropoff",
    });
    return res.status(200).json({
      error: false,
      message: "Dropoff completed successfully",
      data: totalpointGained,
      dd: totalWeight,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dropoffController.scheduledropOffs = async (req, res) => {
  try {
    let data = req.body;
    if (moment(data.dropOffDate) < moment()) {
      return RESPONSE.status(400).json({
        statusCode: 400,
        customMessage: "Invalid date",
      });
    }
    const user = await userModel.findOne({ email: data.scheduleCreator });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: "User not found",
      });
    }

    if (user.status != "active") {
      return res.status(400).json({
        error: true,
        message: "Account disabled, contact support for help",
      });
    }

    const expireDate = moment(data.dropOffDate, "YYYY-MM-DD").add(7, "days");
    data.expiryDuration = expireDate;
    data.clientId = user._id.toString();
    data.state = user.state || "Lagos";

    const schedule = await scheduleDropModel.create(data);

    if (user.onesignal_id !== "") {
      console.log("user", user.onesignal_id);
      sendNotification({
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: `Your dropoff schedule has been made successfully`,
        },
        channel_for_external_user_ids: "push",
        include_external_user_ids: [user.onesignal_id],
      });
      await notificationModel.create({
        title: "Dropoff Schedule made",
        lcd: schedule.lcd,
        message: `Your dropoff schedule has been made successfully`,
        schedulerId: user._id,
      });
    }
    // notify user

    await userModel.updateOne(
      { email: data.client },
      {
        last_logged_in: new Date(),
      }
    );

    //scheduler
    await activitesModel.create({
      userType: "client",
      userId: user._id,
      message: `Dropoff scheduled to ${schedule.organisation}`,
      activity_type: "dropoff",
    });

    return res.status(200).json({
      error: false,
      message: "success",
      data: schedule,
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
