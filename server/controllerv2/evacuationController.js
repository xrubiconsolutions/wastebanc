const {
	collectorModel,
	collectorBinModel,
	wastebancAgentModel,
	evacuationModel,
	evacuationLogModel,
	transactionModel,
	organisationModel,
	userModel,
	legderBalanceModel,
} = require("../models");
const { paginateResponse } = require("../util/commonFunction");
const { EVACUATION_STATUSES_ENUM } = require("../util/constants");
const axios = require("axios");
const rewardService = require("../services/rewardService");

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

			console.log("unevacTransactions", unevacTransactions);
			// return message if nothing is available to evacuate
			if (unevacTransactions.length === 0)
				return res.status(400).json({
					error: true,
					message:
						"You have not collected or completed any pickup or drop-off task",
				});

			// get the total amount to be paid and waste quantity
			const totalAmount = unevacTransactions.reduce(
				(agg, current) => agg + (current.toObject().amountTobePaid || 0),
				0
			);

			console.log("totalAmount", totalAmount);
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
				message: `Evacuation request made for ${transactionIds.length} transaction!`,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				error: true,
				message: "An error occured",
			});
		}
	}

	static async updateRequestStatus(req, res) {
		const { action, requestId } = req.params;
		const actionOptions = ["accept", "approve", "reject"];
		try {
			const evacuationRequest = await evacuationModel.findById(requestId);

			// return error if request not found
			if (!evacuationRequest)
				return res.status(404).json({
					error: true,
					message: "Request Data not found",
				});
			const currentStatus = evacuationRequest.status;

			const organisation = await organisationModel.findById(
				evacuationRequest.organisation
			);
			if (action === actionOptions[0]) {
				// handle accept action
				if (
					[EVACUATION_STATUSES_ENUM[1], EVACUATION_STATUSES_ENUM[2]].includes(
						evacuationRequest.status
					)
				)
					return res.status(400).json({
						error: true,
						message: "Only pending or rejected requests can be accepted",
					});
				evacuationRequest.status = EVACUATION_STATUSES_ENUM[1];
			} else if (action === actionOptions[1]) {
				// handle approve action
				if (evacuationRequest.status !== EVACUATION_STATUSES_ENUM[1]) {
					return res.status(400).json({
						error: true,
						message: "Only accepted requests can be approved",
					});
				}
				console.log({ trns: evacuationRequest.transactions });

				// *** send a request to partner bank to move the the ***
				const url = `${process.env.PAYMENT_URL}disbursement/account/funding`;
				const percentage = rewardService.calPercentage(
					evacuationRequest.totalAmount,
					organisation.systemCharge
				);
				const amount = evacuationRequest.totalAmount + percentage;
				console.log("amount", amount);
				const body = {
					Amount: amount.toString(),
				};
				console.log("ww", body);
				const result = await axios.post(url, body);
				console.log("result", result);
				if (result.status !== 200) {
					return res.status(500).json({
						error: true,
						message: "Error approving transactions!",
					});
				}

				//**** End ********/

				// update the legder balance to the available balance

				const transactions = evacuationRequest.transactions;
				//await handleScheduleApproval(transactions);
				const transactionLength = transactions.length;

				for (let i = 0; i < transactionLength; ++i) {
					const ledgerBalance = await legderBalanceModel.find({
						transactionId: transactions[i],
						paidToBalance: false,
					});

					console.log("leg", ledgerBalance);

					if (ledgerBalance.length > 0) {
						console.log("here");
						const userLB = ledgerBalance.find(
							(lb) => lb.userType == "household"
						);
						const wastepicker = ledgerBalance.find(
							(lb) => lb.userType == "wastepicker"
						);

						if (userLB) {
							console.log("userLB", userLB);
							const userObject = await userModel.findById(userLB.userId);
							if (userObject) {
								console.log("user", userObject);
								// userObject.availablePoints =
								// 	userObject.availablePoints + userLB.pointGained;
								// userObject.save();
								await userModel.updateOne(
									{ email: userObject.email },
									{
										availablePoints:
											userObject.availablePoints + userLB.pointGained,
									}
								);
							}
						}

						if (wastepicker) {
							const collectorObject = await collectorModel.findById(
								wastepicker.userId
							);
							if (collectorObject) {
								collectorObject.pointGained =
									collectorObject.pointGained + userLB.pointGained;
								userObject.save();
							}
						}
					}

					await legderBalanceModel.updateOne(
						{ transactionId: transactions[i] },
						{
							paidToBalance: true,
						}
					);
				}

				await transactionModel.updateMany(
					{
						_id: { $in: evacuationRequest.transactions },
					},
					{
						isEvacuated: true,
					}
				);
				evacuationRequest.status = EVACUATION_STATUSES_ENUM[2];
			} else {
				// handle reject action
				if (
					[EVACUATION_STATUSES_ENUM[2], EVACUATION_STATUSES_ENUM[3]].includes(
						evacuationRequest.status
					)
				)
					return res.status(400).json({
						error: true,
						message: "Only non-approved requests can be rejected",
					});

				evacuationRequest.status = EVACUATION_STATUSES_ENUM[3];
			}

			// save the evacuation request instance
			await evacuationRequest.save();

			// enter activity into evacuation log
			await evacuationLogModel.create({
				evacuation: evacuationRequest._id,
				user: req.user._id,
				action: action.toUpperCase(),
				prevState: currentStatus,
			});
			return res.status(200).json({
				error: false,
				message: "Request status updated!",
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				error: true,
				message: "An error occured!",
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
								phone: 1,
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

	static async handleScheduleApproval(transactions) {
		const transactionLength = transactions.length;

		for (let i = 0; i < transactionLength; ++i) {
			const ledgerBalance = await legderBalanceModel.find({
				transactionId: transactions[i],
			});

			if (ledgerBalance.length > 0) {
				const userLB = ledgerBalance.filter((lb) => lb.userType == "household");
				const wastepicker = ledgerBalance.filter(
					(lb) => lb.userType == "wastepicker"
				);

				if (userLB) {
					const userObject = await userModel.findById(userLB.userId);
					userObject.availablePoints =
						userObject.availablePoints + userLB.pointGained;
				}

				if (wastepicker) {
					const collectorObject = await collectorModel.findById(
						wastepicker.userId
					);
					collectorObject.pointGained =
						collectorObject.pointGained + userLB.pointGained;
				}
			}

			await legderBalanceModel.updateMany(
				{ transactionId: transactions[i] },
				{
					paidToBalance: true,
				}
			);
		}
	}
}

module.exports = EvacuationService;
