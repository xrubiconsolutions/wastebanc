const {
  scheduleModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
} = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const moment = require("moment-timezone");

moment().tz("Africa/Lagos", false);
var sendNotification = function (data) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers,
  };

  var https = require("https");
  var req = https.request(options, function (res) {
    res.on("data", function (data) {
      console.log(JSON.parse(data));
    });
  });

  req.on("error", function (e) {
    console.log(e);
  });

  req.write(JSON.stringify(data));
  req.end();
};

class ScheduleService {
  static async getSchedulesWithFilter(req, res) {
    try {
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        state,
        key,
        completionStatus = { $ne: "" },
      } = req.query;
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
            { Category: { $regex: `.*${key}.*`, $options: "i" } },
            { organisation: { $regex: `.*${key}.*`, $options: "i" } },
            { schuduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
            { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
            { client: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
          ],
          completionStatus,
        };
      } else {
        const [startDate, endDate] = [new Date(start), new Date(end)];
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          completionStatus,
        };
      }
      if (state) criteria.state = state;

      const totalResult = await scheduleModel.countDocuments(criteria);

      // get all schedules within range
      const schedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

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
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async searchSchedules(req, res) {
    let {
      state,
      page = 1,
      key,
      completionStatus = { $ne: "" },
      resultsPerPage = 20,
    } = req.query;
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    const criteria = {
      $or: [
        { Category: { $regex: `.*${key}.*`, $options: "i" } },
        { organisation: { $regex: `.*${key}.*`, $options: "i" } },
        { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
        { client: { $regex: `.*${key}.*`, $options: "i" } },
        { phone: { $regex: `.*${key}.*`, $options: "i" } },
        { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
      ],
      completionStatus,
    };
    if (state) criteria.state = state;

    try {
      // get length of schedules with completion status and provided field value
      const totalResult = await scheduleModel.countDocuments(criteria);

      // get schedules based on page
      const schedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        schedules,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }

  static async getCompanySchedules(req, res) {
    const { companyName: organisation } = req.user;
    let {
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      completionStatus = { $ne: "" },
      key,
    } = req.query;

    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // return error if neither date range nor search key is provided
    if (!key && (!start || !end))
      return sendResponse(res, {
        statusCode: 422,
        customMessage: "Supply a date range (start and end) or key to search",
      });

    const [startDate, endDate] = [new Date(start), new Date(end)];
    const criteria = key
      ? {
          $or: [
            { Category: { $regex: `.*${key}.*`, $options: "i" } },
            { organisation: { $regex: `.*${key}.*`, $options: "i" } },
            { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
            { client: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
          ],
          completionStatus,
          organisation,
        }
      : {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          organisation,
          completionStatus,
        };

    try {
      // get length of schedules with criteria
      const totalResult = await scheduleModel.countDocuments(criteria);

      const companySchedules = await scheduleModel
        .find(criteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * resultsPerPage)
        .limit(resultsPerPage);

      return sendResponse(res, STATUS_MSG.SUCCESS.DEFAULT, {
        companySchedules,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      });
    } catch (error) {
      console.log(error);
      sendResponse(res, STATUS_MSG.ERROR.DEFAULT);
    }
  }

  static async rewardSystem(req, res) {
    bodyValidate(req, res);
    try {
      const collectorId = req.body.collectorId;
      const categories = req.body.categories;
      const scheduleId = req.body.scheduleId;

      const alreadyCompleted = await transactionModel.findOne({
        scheduleId,
      });
      if (alreadyCompleted) {
        return res.status(400).json({
          error: true,
          message: "This transaction had been completed by another recycler",
        });
      }

      const schedule = await scheduleModel.findById(scheduleId);
      if (!schedule) {
        return res.status(400).json({
          error: true,
          message: "Schedule not found",
        });
      }

      const scheduler = await userModel.findOne({
        email: schedule.client,
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

      const organisation = await organisationModel.findById(
        collector.approvedBy
      );
      if (!organisation) {
        return res.status(400).json({
          error: true,
          message:
            "organisation not found or no longer exist, Please contact support",
        });
      }

      let pricing = [];
      let cat;
      //console.log("organisation", organisation);
      for (let category of categories) {
        if (organisation.categories.length !== 0) {
          console.log("here");
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
          //console.log("quantity", parseFloat(category.quantity));
          pricing.push(p);
        } else {
          console.log("here2");
          var cc =
            category.name === "nylonSachet"
              ? "nylon"
              : category.name === "glassBottle"
              ? "glass"
              : category.name.length < 4
              ? category.name.substring(0, category.name.length)
              : category.name.substring(0, category.name.length - 1);

          var organisationCheck = JSON.parse(JSON.stringify(organisation));
          //console.log("organisation check here", organisationCheck);
          for (let val in organisationCheck) {
            //console.log("category check here", cc);
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

      // send push notification to household user
      const message = {
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: `You have just been credited ${totalpointGained} for your schedule`,
        },
        include_player_ids: [`${scheduler.onesignal_id}`],
      };

      await notificationModel.create({
        title: "Schedule completed",
        lcd: scheduler.lcd,
        message: `You have just been credited ${totalpointGained} for your schedule`,
        schedulerId: scheduler._id,
      });

      sendNotification(message);

      //console.log('scheduler', scheduler);
      //console.log('schedule', schedule);
      await scheduleModel.updateOne(
        { _id: schedule._id },
        {
          $set: {
            completionStatus: "completed",
            collectorStatus: "accept",
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
        data: totalpointGained,
        da: totalWeight,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async smartRoute(req, res) {
    try {
      const { user } = req;
      const collectorAccessArea = user.areaOfAccess;
      let geofencedSchedules = [];
      let active_today = new Date();
      active_today.setHours(0);
      active_today.setMinutes(0);
      let tomorrow = new Date();
      tomorrow.setDate(new Date().getDate() + 7);
      console.log("tomorrow", tomorrow);
      // console.log("user", user);

      const active_schedules = await scheduleModel.aggregate([
        {
          $match: {
            $and: [
              {
                pickUpDate: {
                  $gte: active_today,
                },
                pickUpDate: {
                  $lt: tomorrow,
                },
                completionStatus: "pending",
                collectorStatus: "decline",
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "client",
            foreignField: "email",
            as: "client",
          },
        },
        {
          $unwind: {
            path: "$client",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            _id: -1,
          },
        },
      ]);

      await Promise.all(
        active_schedules.map(async (schedule) => {
          if (collectorAccessArea.includes(schedule.lcd)) {
            geofencedSchedules.push(schedule);
          }
          const splitAddress = schedule.address.split(", ");
          await Promise.all(
            splitAddress.map((address) => {
              if (collectorAccessArea.includes(address)) {
                geofencedSchedules.push(schedule);
              }
            })
          );
        })
      );

      const referenceSchedules = [...new Set(geofencedSchedules)];

      return res.status(200).json({
        error: false,
        message: "success",
        data: referenceSchedules,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occurred",
      });
    }
  }

  static async pickup(req, res) {
    try {
      let data = req.body;
      console.log("data", data);

      if (moment(data.pickUpDate) < moment()) {
        return RESPONSE.status(400).json({
          statusCode: 400,
          customMessage: "Invalid date",
        });
      }

      const user = await userModel.findOne({
        email: data.client,
      });

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

      if (user.cardID == null) {
        return (
          res,
          status(400).json({
            error: true,
            message: "You don't have a valid card ID, contact support for help",
          })
        );
      }

      const expireDate = moment(data.pickUpDate, "YYYY-MM-DD").add(7, "days");
      data.expiryDuration = expireDate;
      data.clientId = user._id.toString();
      data.state = user.state;

      console.log("data", data);

      const schedule = await scheduleModel.create(data);
      const collectors = await collectorModel.aggregate([
        {
          $match: {
            areaOfAccess: { $in: [schedule.lcd] },
          },
        },
      ]);
      //send out notification to collectors
      await Promise.all(
        collectors.map(async (collector) => {
          if (!collector.onesignal_id || collector.onesignal_id !== "") {
            const message = {
              app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
              contents: {
                en: `A user in ${schedule.lcd} just created a schedule`,
              },
              include_player_ids: [`${collector.onesignal_id} || ' '`],
            };
            sendNotification(message);
            await notificationModel.create({
              title: "Schedule made",
              lcd: schedule.lcd,
              message: `A user in ${schedule.lcd} just created a schedule`,
              recycler_id: collector._id,
            });
          }
        })
      );

      //send notification to user
      if (user.onesignal_id !== "" || !user.onesignal_id) {
        console.log(user.onesignal_id);
        const playerIds = [`${user.onesignal_id}`];
        console.log("playerids", playerIds);
        sendNotification({
          app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
          contents: {
            en: `Your schedule has been made successfully`,
          },
          include_player_ids: playerIds,
        });
        await notificationModel.create({
          title: "Schedule made",
          lcd: schedule.lcd,
          message: `Your schedule has been made successfully`,
          schedulerId: user._id,
        });
      }

      await userModel.updateOne(
        { email: data.client },
        {
          last_logged_in: new Date(),
        }
      );

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
  }
}

module.exports = ScheduleService;
