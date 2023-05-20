const {
  scheduleDropModel,
  dropOffModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
  activitesModel,
  categoryModel,
  transactionActivitesModel,
  legderBalanceModel,
} = require("../models");
let dropoffController = {};
const moment = require("moment-timezone");
const { sendNotification } = require("../util/commonFunction");
const randomstring = require("randomstring");
const rewardService = require("../services/rewardService");
moment().tz("Africa/Lagos", false);
const mongoose = require("mongoose");

dropoffController.aggregateQuery = async ({
  criteria,
  page = 1,
  resultsPerPage = 20,
}) => {
  try {
    const paginationQuery = [
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $skip: (page - 1) * resultsPerPage,
      },
      {
        $limit: resultsPerPage,
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
                phone: 1,
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
          phone: {
            $ifNull: ["$customer.phone", "$phone"],
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
      {
        $lookup: {
          from: "transactions",
          let: {
            schedule: {
              $toString: "$_id",
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$scheduleId", "$$schedule"],
                },
              },
            },
            {
              $project: {
                categories: 1,
              },
            },
          ],
          as: "cats",
        },
      },
      {
        $project: {
          categoriesQuantity: {
            $arrayElemAt: ["$cats.categories", 0],
          },
          fullname: 1,
          phone: 1,
          clientId: 1,
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

    return {
      dropoffs,
      totalResult:
        totalResult.length > 0 ? Object.values(totalResult[0])[0] : 0,
    };
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
          { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
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

dropoffController.userdropOffs = async (req, res) => {
  try {
    //const { user } = req;
    //const currentScope = user.locationScope;
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      key,
      completionStatus = "pending",
      userId,
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const client = await userModel.findById(userId);

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
          { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        scheduleCreator: client.email,
        completionStatus,
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
        scheduleCreator: client.email,
        completionStatus,
      };
    } else {
      criteria = {
        scheduleCreator: client.email,
        completionStatus,
      };
    }

    // if (!currentScope) {
    //   return res.status(400).json({
    //     error: true,
    //     message: "Invalid request",
    //   });
    // }

    // if (currentScope === "All") {
    //   criteria.state = {
    //     $in: user.states,
    //     scheduleCreator: client.email,
    //     completionStatus,
    //   };
    // } else {
    //   criteria.state = currentScope;
    // }

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
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      state,
      key,
      scheduleApproval = { $ne: "" },
      completionStatus = "pending",
    } = req.query;
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
          { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
          { Category: { $regex: `.*${key}.*`, $options: "i" } },
        ],
        organisation,
        //scheduleApproval,
        completionStatus,
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
        //scheduleApproval,
        completionStatus,
      };
    } else {
      criteria = {
        organisation,
        //scheduleApproval,
        completionStatus,
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
    const newLocation = {
      type: "Point",
      coordinates: [dropLocation.location.long, dropLocation.location.lat],
    };
    const drop = await dropOffModel.create({
      ...dropLocation,
      newLocation,
      orgID: new mongoose.Types.ObjectId(dropLocation.organisationId),
    });
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
  const collectorId = req.user._id;
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

    const orgId = collector.approvedBy
      ? collector.approvedBy
      : collector.organisationId;

    console.log("org", orgId);
    const organisation = await organisationModel.findById(orgId);
    if (!organisation) {
      return res.status(400).json({
        error: true,
        message:
          "organisation not found or no longer exist, Please contact support",
      });
    }

    let cat = [];

    await Promise.all(
      categories.map(async (category) => {
        console.log("c", category);
        const catDetail = await categoryModel.findOne({
          $or: [{ name: category.name }, { value: category.name }],
        });
        if (catDetail) {
          const value = {
            name: catDetail.name,
            catId: catDetail._id,
            quantity: category.quantity,
          };
          cat.push(value);
        }
      })
    );

    if (cat.length == 0) {
      return res.status(400).json({
        message: "Invaild category passed",
        error: true,
      });
    }

    const householdReward = await rewardService.houseHold(cat, organisation);

    console.log("household reward", householdReward);
    if (householdReward.error) {
      return res.status(400).json(householdReward);
    }

    // let wastePickerCoin = 0;
    // let wastePickerPercentage = 0;
    // let collectorPoint = collector.pointGained || 0;
    // if (collector.collectorType == "waste-picker") {
    //   const wastepickerReward = await rewardService.picker(cat, organisation);
    //   if (!wastepickerReward.error) {
    //     wastePickerCoin = wastepickerReward.totalpointGained;
    //     wastePickerPercentage = rewardService.calPercentage(
    //       wastepickerReward.totalpointGained,
    //       10
    //     );
    //     collectorPoint = wastePickerCoin - wastePickerPercentage;
    //   }
    // }

    const userCoin =
      Number(householdReward.totalpointGained) - Number(pakamPercentage);

    const pakamPercentage = rewardService.calPercentage(
      householdReward.totalpointGained,
      10
    );
    const ref = randomstring.generate({
      length: 7,
      charset: "numeric",
    });
    const amountTobePaid = userCoin + pakamPercentage;
    const t = await transactionModel.create({
      weight: householdReward.totalWeight,
      wastePickerCoin: 0,
      wastePickerPercentage: 0,
      coin: userCoin.toFixed(),
      cardID: scheduler._id,
      completedBy: collectorId,
      categories,
      fullname: `${scheduler.fullname} `,
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
      phone: scheduler.phone,
      amountTobePaid,
    });

    const items = categories.map((category) => category.name);

    await transactionActivitesModel.create({
      userId: scheduler._id,
      transaction: t._id,
      type: "schedule_pickup",
      transactionType: "credit",
      amount: userCoin.toFixed(),
      userType: "household",
      message: `${items}`,
      status: "successful",
    });

    const message = {
      app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
      contents: {
        en: `You have just been credited ${t.coin} for your ${items} drop off`,
      },
      channel_for_external_user_ids: "push",
      include_external_user_ids: [scheduler.onesignal_id],
      //include_player_ids: [`${scheduler.onesignal_id}`],
    };

    const userledgerBalance = {
      dropoffId: dropoffs._id.toString(),
      point: userCoin.toFixed(),
    };
    // const collectorledgerBalance = {
    //   dropoffId: dropoffs._id.toString(),
    //   point: collectorPoint + collector.pointGained,
    // };

    // let newledgerBalance = scheduler.ledgerPoints || [];
    // //let newCollectorLedgerBalance = collector.ledgerPoints || [];
    // newledgerBalance.push(userledgerBalance);
    // // newCollectorLedgerBalance.push(collectorledgerBalance);

    await scheduleDropModel.updateOne(
      { _id: dropoffs._id },
      {
        $set: {
          completionStatus: "completed",
          collectedBy: collectorId,
          quantity: householdReward.totalWeight,
          completionDate: new Date(),
        },
      }
    );

    await userModel.updateOne(
      { email: scheduler.email },
      {
        $set: {
          //availablePoints: scheduler.availablePoints + userCoin,
          //ledgerPoints: newledgerBalance,
          schedulePoints: scheduler.schedulePoints + 1,
        },
      }
    );

    await legderBalanceModel.create({
      userId: scheduler._id,
      pointGained: +userCoin.toFixed(),
      userType: "household",
      previousBalance: scheduler.availablePoints,
      scheduleType: "dropoff",
      scheduleId: dropoffs._id,
      transactionId: t._id,
    });

    // await collectorModel.updateOne(
    //   { _id: collector._id },
    //   {
    //     $set: {
    //       totalCollected:
    //         collector.totalCollected + householdReward.totalWeight,
    //       numberOfTripsCompleted: collector.numberOfTripsCompleted + 1,
    //       pointGained: collectorPoint + collector.pointGained,
    //       //ledgerPoints: newCollectorLedgerBalance,
    //       busy: false,
    //       last_logged_in: new Date(),
    //     },
    //   }
    // );

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

    await notificationModel.create({
      title: "Dropoff Schedule completed",
      lcd: scheduler.lcd,
      message: `You have just been credited ${t.coin} for your ${items} drop off`,
      schedulerId: scheduler._id,
    });

    sendNotification(message);

    return res.status(200).json({
      error: false,
      message: "Dropoff completed successfully",
      data: householdReward.totalpointGained,
      dd: householdReward.totalWeight,
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
      return res.status(400).json({
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

    let categories = [];

    await Promise.all(
      data.categories.map(async (category) => {
        console.log("c", category);
        const catDetail = await categoryModel.findOne({
          $or: [{ name: category }, { value: category }],
        });
        if (catDetail) {
          const value = {
            name: catDetail.name,
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

    const expireDate = moment(data.dropOffDate, "YYYY-MM-DD").add(7, "days");
    data.expiryDuration = expireDate;
    data.clientId = user._id.toString();
    data.state = user.state || "Lagos";
    data.categories = categories;

    const schedule = await scheduleDropModel.create(data);
    const items = categories.map((category) => category.name);

    if (user.onesignal_id !== "") {
      console.log("user", user.onesignal_id);
      sendNotification({
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: `Your ${items} dropoff schedule has been made successfully`,
        },
        channel_for_external_user_ids: "push",
        include_external_user_ids: [user.onesignal_id],
      });
      await notificationModel.create({
        title: "Dropoff Schedule made",
        lcd: schedule.lcd,
        message: `Your ${items} waste has been schedule for  dropoff to ${schedule.organisation}`,
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
      message: `Your ${items} waste has been schedule for  dropoff to ${schedule.organisation}`,
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

dropoffController.hubConfirmSchedule = async (req, res) => {
  try {
    const { user } = req;
    const organisationId = user._id.toString();
    const { scheduleId } = req.body;
    console.log("s", scheduleId);
    const schedule = await scheduleDropModel.findById(scheduleId);
    if (!schedule) {
      return res.status(400).json({
        error: true,
        message: "Schedule not found",
      });
    }

    if (schedule.organisationCollection != organisationId) {
      return res.status(400).json({
        error: true,
        message: "Action cannot be perform",
      });
    }

    if (
      schedule.scheduleApproval == "true" ||
      schedule.scheduleApproval == "false"
    ) {
      return res.status(400).json({
        error: true,
        message: "Action cannot be perform. contact support team",
      });
    }

    const scheduler = await userModel.findById(schedule.clientId);
    if (!scheduler) {
      return res.status(400).json({
        error: true,
        message: "No Household user connected to this schedule",
      });
    }

    const userpoint = scheduler.ledgerPoints.find(
      (schedule) => schedule.scheduleId == scheduleId
    );

    if (userpoint) {
      const newledgerPoints = scheduler.ledgerPoints.filter(
        (schedule) => schedule.scheduleId != scheduleId
      );
      scheduler.availablePoints = scheduler.availablePoints + userpoint.point;
      scheduler.ledgerPoints = newledgerPoints;
      scheduler.save();

      schedule.scheduleApproval = "true";
      schedule.approvedBy = {
        user: "company",
        email: user.email.trim(),
        userId: user._id,
      };
      schedule.approvalDate = new Date();
      schedule.save();

      await transactionModel.updateOne(
        { scheduleId: schedule._id.toString() },
        {
          approval: "true",
        }
      );
    }

    return res.status(200).json({
      error: false,
      message: "Dropoff schedule verified successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dropoffController.hubRejectSchedule = async (req, res) => {
  try {
    const { user } = req;
    const organisationId = user._id.toString();
    const { scheduleId, reason } = req.body;
    const schedule = await scheduleDropModel.findById(scheduleId);
    if (!schedule) {
      return res.status(400).json({
        error: true,
        message: "Schedule not found",
      });
    }

    if (
      schedule.scheduleApproval == "true" ||
      schedule.scheduleApproval == "false"
    ) {
      return res.status(400).json({
        error: true,
        message: "Action cannot be perform. contact support team",
      });
    }

    if (schedule.organisationCollection != organisationId) {
      return res.status(400).json({
        error: true,
        message: "Action cannot be perform",
      });
    }

    schedule.scheduleApproval = "false";
    schedule.rejectReason = reason;
    schedule.rejectionDate = new Date();
    schedule.save();

    await transactionModel.updateOne(
      { scheduleId: schedule._id.toString() },
      {
        approval: "false",
      }
    );

    return res.status(200).json({
      error: false,
      message: "Drop off schedule rejected",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: true,
      message: "An error occurred",
    });
  }
};

dropoffController.pakamConfirmSchedule = async (req, res) => {
  try {
    const { user } = req;
    const organisationId = user._id.toString();
    const { scheduleId } = req.body;
    const schedule = await scheduleDropModel.findById(scheduleId);
    if (!schedule) {
      return res.status(400).json({
        error: true,
        message: "Schedule not found",
      });
    }

    if (schedule.organisationCollection != organisationId) {
      return res.status(400).json({
        error: true,
        message: "Action cannot be perform",
      });
    }

    if (schedule.scheduleApproval == true) {
      return res.status(400).json({
        error: true,
        message: "Schedule already been approved",
      });
    }

    const scheduler = await userModel.findById(schedule.clientId);
    if (!scheduler) {
      return res.status(400).json({
        error: true,
        message: "No Household user connected to this schedule",
      });
    }

    const userpoint = scheduler.ledgerPoints.find(
      (schedule) => schedule.scheduleId == scheduleId
    );

    if (userpoint) {
      const newledgerPoints = scheduler.ledgerPoints.filter(
        (schedule) => schedule.scheduleId != scheduleId
      );
      scheduler.availablePoints = scheduler.availablePoints + userpoint.point;
      scheduler.ledgerPoints = newledgerPoints;
      scheduler.save();

      schedule.scheduleApproval = true;
      schedule.approvedBy = {
        user: "company",
        email: user.email.trim(),
        userId: user._id,
      };
      schedule.approvalDate = new Date();
      schedule.save();

      await transactionModel.updateOne(
        { scheduleId: schedule._id.toString() },
        {
          approval: "true",
        }
      );
    }

    const collector = await collectorModel.findById(schedule.collectedBy);

    if (!collector) {
      return res.status(400).json({
        error: true,
        message: "No Collector connected to this schedule",
      });
    }

    if (collector.collectorType == "waste-picker") {
      const collectorPoint = collector.ledgerPoints.find(
        (schedule) => schedule.scheduleId == scheduleId
      );

      if (collectorPoint) {
        const newpoints = collector.ledgerPoints.filter(
          (schedule) => schedule.scheduleId == scheduleId
        );
        collector.pointGained = collector.pointGained + collectorPoint.point;
        collector.ledgerPoints = newpoints;
        collector.save();
      }
    }

    return res.status(200).json({
      error: false,
      message: "Dropoff schedule verified successfully",
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
