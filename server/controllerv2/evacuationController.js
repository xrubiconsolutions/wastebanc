const {
  collectorModel,
  collectorBinModel,
  wastebancAgentModel,
  evacuationModel,
  transactionModel,
} = require("../models");
const { paginateResponse } = require("../util/commonFunction");
const { EVACUATION_STATUSES_ENUM } = require("../util/constants");

class EvacuationService {
  static async requestEvacuation(req, res) {
    const {
      user: { _id: collectorId, organisationId: organisationID, aggregatorId },
    } = req;
    try {
      // extract collector's unevacuated transactions
      const unEvacTransactionsCriteria = {
        organisationID,
        completedBy: collectorId,
        requestedEvacuation: { $ne: true },
        isEvacuated: { $ne: true },
      };
      const unevacTransactions = await transactionModel.find(
        unEvacTransactionsCriteria
      );

      // return message if nothing is available to evacuate
      if (unevacTransactions.length === 0)
        return res.status(200).json({
          error: false,
          message:
            "No unevacuated transaction or transaction without evacuation request",
        });

      // get the total amount to be paid and waste quantity
      const totalAmount = unevacTransactions.reduce(
        (agg, current) => agg + (current.toObject().amountToBePaid || 0),
        0
      );
      const totalWeight = unevacTransactions.reduce(
        (agg, current) => agg + (current.toObject().weight || 0),
        0
      );

      // get all transactions id
      const transactionIds = unevacTransactions.map((item) => item._id);

      // create evacuation instance in db
      await evacuationModel.create({
        transactions: transactionIds,
        collector: collectorId,
        totalAmount,
        organisation: organisationID,
        totalWeight,
      });

      // update all transactions involved to have evacuation request sent
      await transactionModel.updateMany(unEvacTransactionsCriteria, {
        requestedEvacuation: true,
      });

      // return success message
      return res.status(200).json({
        error: false,
        message: `Evacuation request made for ${transactionIds.length} transactions!`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }

  static async getEvacuationRequests(req, res) {
    let {
      status,
      page = 1,
      resultsPerPage = 20,
      key,
      start = "2020-01-01",
      end = new Date(),
    } = req.query;

    // construct pagination data
    if (typeof page === "string") page = parseInt(page);
    if (typeof resultsPerPage === "string")
      resultsPerPage = parseInt(resultsPerPage);

    if (!key && (!start || !end))
      return res.status(422).json({
        error: true,
        message: "Supply a date range (start and end) or key to search",
      });

    if (new Date(start) > new Date(end)) {
      return res.status(400).json({
        error: true,
        message: "Start date cannot be greater than end date",
      });
    }

    const [startDate, endDate] = [new Date(start), new Date(end)];
    endDate.setDate(endDate.getDate() + 1);

    let searchQuery = {};
    let requestCriteria = {};

    if (key) {
      searchQuery = {
        $or: [
          {
            "collector.fullname": { $regex: `.*${key}.*`, $options: "i" },
          },
          { "collector.phone": { $regex: `.*${key}.*`, $options: "i" } },
          { "colelctor.address": { $regex: `.*${key}.*`, $options: "i" } },
        ],
      };

      if (Number(key).toString() !== "NaN") {
        searchQuery.$or.push({ totalWeight: Number(key) });
        searchQuery.$or.push({ totalAmount: Number(key) });
      }
    } else {
      requestCriteria = {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      };
    }

    if (status && EVACUATION_STATUSES_ENUM.includes(status.toUpperCase()))
      requestCriteria.status = status.toUpperCase();

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
        $match: requestCriteria,
      },
      {
        $lookup: {
          from: "collectors",
          let: {
            collectorId: {
              $toObjectId: "$collector",
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$collectorId"],
                },
              },
            },
            {
              $project: {
                fullname: 1,
                address: 1,
                phone: 1,
              },
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
        $match: {
          ...searchQuery,
        },
      },
      {
        $lookup: {
          from: "transactions",
          let: {
            transactionIds: "$transactions",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$transactionIds"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                weight: 1,
                address: 1,
                createdAt: 1,
              },
            },
          ],
          as: "transactions",
        },
      },
    ];

    const countCriteria = [
      ...pipeline,
      {
        $count: "createdAt",
      },
    ];
    try {
      let totalResult = await evacuationModel.aggregate(countCriteria);
      const requests = await evacuationModel.aggregate([
        ...pipeline,
        ...paginationQuery,
      ]);
      let totalValue;
      if (totalResult.length == 0) {
        totalValue = 0;
      } else {
        totalValue = Object.values(totalResult[0])[0];
      }

      return res.status(200).json({
        error: false,
        message: "success",
        data: {
          requests,
          totalResult: totalValue,
          page,
          resultsPerPage,
          totalPages: Math.ceil(totalValue / resultsPerPage),
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: true,
        message: "An error occured",
      });
    }
  }
}

module.exports = EvacuationService;
