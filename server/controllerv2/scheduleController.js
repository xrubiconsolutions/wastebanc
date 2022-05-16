const {
  scheduleModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
  activitesModel,
} = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const moment = require("moment-timezone");
const { sendNotification } = require("../util/commonFunction");
const randomstring = require("randomstring");

moment().tz("Africa/Lagos", false);

class ScheduleService {
  static async getSchedulesWithFilter(req, res) {
    try {
      const { user } = req;
      const currentScope = user.locationScope;
      let {
        page = 1,
        resultsPerPage = 20,
        start,
        end,
        //state,
        key,
        completionStatus = { $ne: "" },
      } = req.query;
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
      let collectorStatus = { $ne: "" };
      if (completionStatus === "accepted") {
        collectorStatus = "accept";
        completionStatus = "pending";
      }
      if (completionStatus === "pending") {
        collectorStatus = "decline";
        completionStatus = "pending";
      }
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
          collectorStatus,
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
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          collectorStatus,
          completionStatus,
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

      console.log(criteria);
      //if (state) criteria.state = state;

      const totalResult = await scheduleModel.countDocuments(criteria);

      const skip = (page - 1) * resultsPerPage;

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
    let statusCriteria = {};
    let collectorStatus = { $ne: "" };
    if (completionStatus === "accepted") {
      collectorStatus = "accept";
      completionStatus = "pending";
    }

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
          collectorStatus,
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
          collectorStatus,
        };
    console.log("Criteria: ", criteria);

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
    try {
      const collectorId = req.user._id;
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
      console.log("collector", collector);
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

      const ref = randomstring.generate({
        length: 7,
        charset: "numeric",
      });

      const t = await transactionModel.create({
        weight: totalWeight,
        coin: totalpointGained,
        cardID: scheduler._id,
        completedBy: collectorId,
        categories,
        fullname: `${scheduler.firstname} ${scheduler.lastname}`,
        recycler: collector.fullname,
        aggregatorId: collector.aggregatorId,
        organisation: collector.organisation,
        organisationID: organisation._id,
        scheduleId: schedule._id,
        type: "pickup schedule",
        state: scheduler.state || "",
        ref_id: ref,
      });

      // send push notification to household user
      const message = {
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: `You have just been credited ${totalpointGained} for the pickup`,
        },
        channel_for_external_user_ids: "push",
        include_external_user_ids: [scheduler.onesignal_id],
      };

      await notificationModel.create({
        title: "Pickup Schedule completed",
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

      // store the user activity for both scheduler and collector
      // collector
      await activitesModel.create({
        userId: collector._id,
        message: `Pickup completed. Reference ID: ${t.ref_id}`,
        activity_type: "pickup",
      });

      //scheduler
      await activitesModel.create({
        userType: "client",
        userId: scheduler._id,
        message: `Pickup completed. Reference ID: ${t.ref_id}`,
        activity_type: "pickup",
      });
      return res.status(200).json({
        error: false,
        message: "Pickup completed successfully",
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
      let areaOfAccess;
      if (user.organisationId) {
        const organisation = await organisationModel.findById(
          user.organisationId
        );
        //console.log("user organisation", organisation);
        if (organisation) {
          areaOfAccess = organisation.areaOfAccess;
        }
      } else {
        areaOfAccess = user.areaOfAccess;
      }

      const collectorAccessArea = areaOfAccess;
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
                state: user.state || "Lagos",
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
        return res.status(400).json({
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
              app_id: "565970dc-d44a-456f-aab7-3f57e0504ff4",
              contents: {
                en: `A user in ${schedule.lcd} just created a schedule`,
              },
              channel_for_external_user_ids: "push",
              include_external_user_ids: [collector.onesignal_id],
              //include_player_ids: [`${collector.onesignal_id} || ' '`],
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
        const playerIds = [user.onesignal_id];
        console.log("playerids", playerIds);
        sendNotification({
          app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
          contents: {
            en: `Your pickup schedule has been made successfully`,
          },
          channel_for_external_user_ids: "push",
          include_external_user_ids: playerIds,
        });
        await notificationModel.create({
          title: "Pickup Schedule made",
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

  static async acceptSchedule(req, res) {
    try {
      const { user } = req;
      const schedule = await scheduleModel.findById(req.body._id);
      if (!schedule) {
        return res.status(400).json({
          error: true,
          message: "Schedule not found",
        });
      }

      if (schedule.collectorStatus === "accept") {
        return res.status(400).json({
          error: true,
          message: "This schedule had been accepted by another collector",
        });
      }

      await scheduleModel.updateOne(
        { _id: schedule._id },
        {
          $set: {
            collectorStatus: "accept",
            collectedBy: user._id,
            collectedPhone: user.phone,
            organisation: user.organisation,
            organisationCollection: user.approvedBy,
            recycler: user.fullname,
          },
        }
      );

      const client = await userModel.findOne({ email: schedule.client });

      if (!client) {
        return res.status(400).json({
          error: true,
          message: "Client not found or removed from the system",
        });
      }

      // notify client
      sendNotification({
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: "A collector just accepted your schedule",
        },
        channel_for_external_user_ids: "push",
        include_external_user_ids: [client.onesignal_id],
      });
      await notificationModel.create({
        title: "Pickup Schedule Accepted",
        lcd: client.lcd,
        message: "A collector just accepted your schedule",
        schedulerId: client._id,
      });

      await collectorModel.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            busy: true,
          },
        }
      );

      // collector activity
      await activitesModel.create({
        userId: user._id,
        message: "Pickup Accepted",
        activity_type: "pickup",
      });

      schedule.collectorStatus = "accept";
      schedule.collectedBy = user._id;
      schedule.collectedPhone = user.phone;
      schedule.organisation = user.organisation;
      schedule.organisationCollection = user.approvedBy;
      schedule.recycler = user.fullname;

      return res.status(200).json({
        error: false,
        message: "Pickup schedule accepted",
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
