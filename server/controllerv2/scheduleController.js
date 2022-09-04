const {
  scheduleModel,
  userModel,
  transactionModel,
  collectorModel,
  organisationModel,
  notificationModel,
  activitesModel,
  centralAccountModel,
  categoryModel,
} = require("../models");
const { sendResponse, bodyValidate } = require("../util/commonFunction");
const { STATUS_MSG } = require("../util/constants");
const moment = require("moment-timezone");
const { sendNotification } = require("../util/commonFunction");
const randomstring = require("randomstring");
const rewardService = require("../services/rewardService");
const { logger } = require("../config/logger");
const mongoose = require("mongoose");

class ScheduleService {
  static async aggregateQuery({ criteria, page = 1, resultsPerPage = 20 }) {
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
    try {
      const pipeline = [
        {
          $match: criteria,
        },
        {
          $lookup: {
            from: "users",
            let: {
              email: "$client",
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
                  phone: 1,
                  gender: 1,
                  userId: "$_id",
                  email: 1,
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
            gender: "$customer.gender",
            email: "$customer.email",
            scheduleCreator: 1,
            categories: 1,
            Category: 1,
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
            details: 1,
            address: 1,
            pickUpDate: 1,
            expiryDuration: 1,
            reminder: 1,
            callOnArrival: 1,
            completionStatus: 1,
            acceptedBy: 1,
            collectedBy: 1,
            collectedPhone: 1,
            rating: 1,
            comment: 1,
            organisationCollection: 1,
            lcd: 1,
            lat: 1,
            long: 1,
            recycler: 1,
            completionDate: 1,
            state: 1,
          },
        },
      ];

      const countCriteria = [
        ...pipeline,
        {
          $count: "createdAt",
        },
      ];
      let totalResult = await scheduleModel.aggregate(countCriteria);

      const schedules = await scheduleModel.aggregate([
        ...pipeline,
        ...paginationQuery,
      ]);

      let totalValue;
      if (totalResult.length == 0) {
        totalValue = 0;
      } else {
        totalValue = Object.values(totalResult[0])[0];
      }

      return { schedules, totalResult: totalValue };
    } catch (error) {
      throw error;
    }
  }

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

      let criteria;
      let collectorStatus = { $ne: "" };
      if (completionStatus === "accepted") {
        collectorStatus = "accept";
        completionStatus = "pending";
      } else if (completionStatus === "pending") {
        collectorStatus = "decline";
        completionStatus = "pending";
      }
      if (key) {
        criteria = {
          $or: [
            { Category: { $regex: `.*${key}.*`, $options: "i" } },
            { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
            { categories: { $regex: `.*${key}.*`, $options: "i" } },
            { organisation: { $regex: `.*${key}.*`, $options: "i" } },
            { scheduleCreator: { $regex: `.*${key}.*`, $options: "i" } },
            { collectorStatus: { $regex: `.*${key}.*`, $options: "i" } },
            { client: { $regex: `.*${key}.*`, $options: "i" } },
            { phone: { $regex: `.*${key}.*`, $options: "i" } },
            { completionStatus: { $regex: `.*${key}.*`, $options: "i" } },
            { recycler: { $regex: `.*${key}.*`, $options: "i" } },
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
        endDate.setDate(endDate.getDate() + 1);
        criteria = {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
          collectorStatus,
          completionStatus,
        };
      } else {
        criteria = {
          collectorStatus,
          completionStatus,
        };
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

      const { schedules, totalResult } = await ScheduleService.aggregateQuery({
        criteria,
        page,
        resultsPerPage,
      });

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
        { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
        { categories: { $regex: `.*${key}.*`, $options: "i" } },
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
      // // get length of schedules with completion status and provided field value
      // const totalResult = await scheduleModel.countDocuments(criteria);

      // // get schedules based on page
      // const schedules = await scheduleModel
      //   .find(criteria)
      //   .sort({ createdAt: -1 })
      //   .skip((page - 1) * resultsPerPage)
      //   .limit(resultsPerPage);

      const { schedules, totalResult } = await ScheduleService.aggregateQuery({
        criteria,
        page,
        resultsPerPage,
      });

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
    try {
      return ScheduleService.getOrgSchedules(res, {
        organisation,
        ...req.query,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  // returns completed pickup and dropoff schedules for an organisation
  // from the admin dashboard
  static async getCompanySchedulesForAdmin(req, res) {
    const { companyId } = req.params;
    let { key, start, end, type = "pickup" } = req.query;

    if (!key && (!start || !end))
      return res.status(422).json({
        error: true,
        message: "Supply a date range (start and end) or key to search",
      });

    const searchFields = [
      "ref_id",
      "address",
      "coin",
      "fullname",
      "weight",
      "categories.name",
    ];
    const { criteria, page, resultsPerPage } =
      ScheduleService.extractPaginationCriteria(
        req,
        {
          type: type === "pickup" ? "pickup" : "dropoff",
        },
        searchFields
      );
    try {
      const company = await organisationModel.findById(companyId);
      if (!company)
        return res(404).json({
          error: true,
          message: "Organisation with ID not found!",
        });

      const result = await ScheduleService.paginateModelData({
        model: transactionModel,
        page,
        resultsPerPage,
        criteria,
      });
      return res.status(200).json(result);
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured!",
      });
    }
  }

  static async getOrgSchedules(
    res,
    {
      organisation,
      page = 1,
      resultsPerPage = 20,
      start,
      end,
      completionStatus = { $ne: "" },
      key,
    },
    type = "pickup"
  ) {
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    // return error if neither date range nor search key is provided
    if (!key && (!start || !end))
      return res.status(422).json({
        error: true,
        message: "Supply a date range (start and end) or key to search",
      });

    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);
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
            { "categories.name": { $regex: `.*${key}.*`, $options: "i" } },
            { categories: { $regex: `.*${key}.*`, $options: "i" } },
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

    try {
      // // get length of schedules with criteria
      const { schedules: companySchedules, totalResult } =
        await ScheduleService.aggregateQuery({
          criteria,
          page,
          resultsPerPage,
        });

      return res.status(200).json({
        companySchedules,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async paginateModelData({
    model,
    page = 1,
    resultsPerPage = 20,
    criteria,
    aggregation,
    countCriteria,
  }) {
    try {
      // get length of schedules with criteria
      let totalResult = countCriteria
        ? await model.aggregate(countCriteria)
        : await model.countDocuments(criteria);
      console.log({
        totalResult,
      });

      if (countCriteria)
        totalResult.length > 0
          ? (totalResult = Object.values(totalResult[0])[0])
          : (totalResult = 0);

      const data = aggregation
        ? await model
            .aggregate(aggregation)
            .sort({ createdAt: -1 })
            .skip((page - 1) * resultsPerPage)
            .limit(resultsPerPage)
        : await model
            .find(criteria)
            .sort({ createdAt: -1 })
            .skip((page - 1) * resultsPerPage)
            .limit(resultsPerPage);

      return {
        data,
        totalResult,
        page,
        resultsPerPage,
        totalPages: Math.ceil(totalResult / resultsPerPage),
      };
    } catch (error) {
      throw error;
    }
  }

  static extractPaginationCriteria(
    req,
    conditions,
    searchFields = [],
    numFields = ["weight", "coin"]
  ) {
    let { page = 1, key, resultsPerPage = 20, start, end } = req.query;

    // return error if neither date range nor search key is provided
    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);

    // seperate string from int fields for search
    const stringSearchFields = searchFields.filter(
      (field) => !numFields.includes(field)
    );

    let searchConditions = stringSearchFields.map((field) => ({
      [field]: { $regex: `.*${key}.*`, $options: "i" },
    }));

    // add equality check to search conditions if key is a number
    if (key && parseFloat(key)) {
      const equalityChecks = numFields.map((field) => ({
        [field]: { $eq: parseFloat(key) },
      }));
      searchConditions = searchConditions.concat(equalityChecks);
    }

    const criteria =
      key && searchFields.length > 0
        ? {
            $or: searchConditions,
            ...conditions,
          }
        : {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            ...conditions,
          };

    return { criteria, page, resultsPerPage };
  }

  static async rewardSystem(req, res) {
    try {
      const { user } = req;
      const collectorId = user._id;
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

      if (schedule.collectorStatus != "accept") {
        return res.status(400).json({
          error: true,
          message: "Schedule has not been accepted",
        });
      }

      if (schedule.collectedBy != collectorId.toString()) {
        return res.status(400).json({
          error: true,
          message: "You do not have permission to completed schedule",
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
      if (!collector || collector.companyVerified === false) {
        return res.status(400).json({
          error: true,
          message: "Collector not found or has not be verified",
        });
      }

      const orgId = collector.approvedBy
        ? collector.approvedBy
        : collector.organisationId;

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

      let wastePickerCoin = 0;
      let wastePickerPercentage = 0;
      if (collector.collectorType == "waste-picker") {
        const wastepickerReward = await rewardService.picker(cat, organisation);
        if (!wastepickerReward.error) {
          wastePickerCoin = wastepickerReward.totalpointGained;
          wastePickerPercentage = rewardService.calPercentage(
            wastepickerReward.totalpointGained,
            10
          );
        }
      }

      const pakamPercentage = rewardService.calPercentage(
        householdReward.totalpointGained,
        10
      );

      const ref = randomstring.generate({
        length: 7,
        charset: "numeric",
      });

      const t = await transactionModel.create({
        weight: householdReward.totalWeight,
        coin:
          Number(householdReward.totalpointGained) - Number(pakamPercentage),
        wastePickerCoin,
        wastePickerPercentage,
        cardID: scheduler._id,
        completedBy: collectorId,
        categories,
        fullname: `${scheduler.fullname}`,
        recycler: collector.fullname,
        aggregatorId: collector.aggregatorId,
        organisation: collector.organisation,
        organisationID: organisation._id,
        scheduleId: schedule._id,
        type: "pickup",
        state: scheduler.state || "",
        ref_id: ref,
        percentage: pakamPercentage,
        address: schedule.address,
      });

      const items = categories.map((category) => category.name);

      //  send push notification to household user
      const message = {
        app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
        contents: {
          en: `You have just been credited ${householdReward.totalpointGained} for your ${items} pickup`,
        },
        channel_for_external_user_ids: "push",
        include_external_user_ids: [scheduler.onesignal_id],
      };

      await notificationModel.create({
        title: "Pickup Schedule completed",
        lcd: scheduler.lcd,
        message: `You have just been credited ${householdReward.totalpointGained} for the ${items} pickup`,
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
            quantity: householdReward.totalWeight,
            completionDate: new Date(),
          },
        }
      );

      await userModel.updateOne(
        { email: scheduler.email },
        {
          $set: {
            availablePoints:
              scheduler.availablePoints + householdReward.totalpointGained,
            schedulePoints: scheduler.schedulePoints + 1,
          },
        }
      );

      await collectorModel.updateOne(
        { _id: collector._id },
        {
          $set: {
            totalCollected:
              collector.totalCollected + householdReward.totalWeight,
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
        message: `${items} pickup completed. Reference ID: ${t.ref_id}`,
        activity_type: "pickup",
      });

      //house hold user
      await activitesModel.create({
        userType: "client",
        userId: scheduler._id,
        message: `${items} pickup completed. Reference ID: ${t.ref_id}`,
        activity_type: "pickup",
      });
      return res.status(200).json({
        error: false,
        message: "Pickup completed successfully",
        data: householdReward.totalpointGained,
        da: householdReward.totalWeight,
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
        if (organisation) {
          areaOfAccess = organisation.streetOfAccess;
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

      const expireDate = moment(data.pickUpDate, "YYYY-MM-DD").add(7, "days");
      data.expiryDuration = expireDate;
      data.clientId = user._id.toString();
      data.state = user.state || "Lagos";
      data.categories = categories;

      if (data.reminder === true) {
        data.reminderDate = moment(data.pickUpDate, "YYYY-MM-DD").add(
          6,
          "days"
        );
      }

      const catIds = categories.map((category) => category.catId);

      console.log("catids", catIds);
      const schedule = await scheduleModel.create(data);
      const organisations = await organisationModel.aggregate([
        {
          $match: {
            streetOfAccess: { $in: [schedule.lcd] },
            "categories.catId": { $in: catIds },
          },
        },
        {
          $addFields: {
            _id: {
              $toString: "$_id",
            },
          },
        },
        {
          $lookup: {
            from: "collectors",
            localField: "_id",
            foreignField: "organisationId",
            as: "collectors",
          },
        },
      ]);
      // console.log("organisations", organisations);
      // const collectors = await collectorModel.aggregate([
      //   {
      //     $match: {
      //       areaOfAccess: { $in: [schedule.lcd] },
      //     },
      //   },
      // ]);
      //send out notification to collectors
      const items = categories.map((category) => category.name);
      await Promise.all(
        organisations.map(async (organisation) => {
          organisation.collectors.map(async (collector) => {
            if (!collector.onesignal_id || collector.onesignal_id !== "") {
              const message = {
                app_id: "565970dc-d44a-456f-aab7-3f57e0504ff4",
                contents: {
                  en: `A user in ${schedule.lcd} just created a ${items} schedule`,
                },
                channel_for_external_user_ids: "push",
                include_external_user_ids: [collector.onesignal_id],
                //include_player_ids: [`${collector.onesignal_id} || ' '`],
              };
              sendNotification(message);
              await notificationModel.create({
                title: "Schedule made",
                lcd: schedule.lcd,
                message: `A user in ${schedule.lcd} just created a ${items} schedule`,
                recycler_id: collector._id,
              });
            }
          });
        })
      );

      //send notification to user
      if (user.onesignal_id !== "" || !user.onesignal_id) {
        console.log(user.onesignal_id);
        const playerIds = [user.onesignal_id];

        sendNotification({
          app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
          contents: {
            en: `Your ${items} schedule has been made successfully`,
          },
          channel_for_external_user_ids: "push",
          include_external_user_ids: playerIds,
        });
        await notificationModel.create({
          title: "Pickup Schedule made",
          lcd: schedule.lcd,
          message: `Your ${items} schedule has been made successfully`,
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
