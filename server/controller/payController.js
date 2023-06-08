"use strict";

/**************************************************
 ***** Organisation controller for organisation logic ****
 **************************************************/

let payController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let SERVICE = require("../services/commonService");
let CONSTANTS = require("../util/constants");
var request = require("request");
var ObjectId = require("mongodb").ObjectID;
const axios = require("axios");
const { payModel, charityOrganisationModel } = require("../models");
const SlackService = require("../services/slackService");

payController.getBanks = (req, res) => {
	request(
		// update
		// {
		//   url: "https://api.paystack.co/bank",
		//   method: "GET",
		//   headers: {
		//     Accept: "application/json",
		//     "Accept-Charset": "utf-8",
		//     Authorization: `Bearer sk_test_a9fa4b3ea294cde982654ac464b9f3e20e90a24c`,
		//   },
		//   json: true,
		// },
		{
			url: `${process.env.PAYMENT_URL}all/banks`,
			method: "GET",
			headers: {
				Accept: "application/json",
				"Accept-Charset": "utf-8",
			},
			json: true,
		},
		(err, result) => {
			if (err) return res.status(400).json(err);
			return res.status(200).json(result.body.data);
		}
	);
};

payController.resolveAccount = (req, res) => {
	const account_number = req.query.account_number;
	const bank_code = req.query.bank_code;
	const { user } = req;
	console.log({ user });
	request(
		{
			url: `${process.env.PAYMENT_URL}resolve/account?account_number=${account_number}&bank_code=${bank_code}&userId=${user._id}`,
			method: "GET",
			headers: {
				Accept: "application/json",
				"Accept-Charset": "utf-8",
			},
			json: true,
		},
		(err, result) => {
			console.log("err=>", err);
			if (err) return res.status(400).json(err);
			if (result.body.statusCode && result.body.statusCode >= 400)
				return res.status(result.body.statusCode).json(result.body);

			// return only account number and account name if request is made by admin
			if (user.roles === "admin") {
				const { account_name, account_number } =
					result.body.data.accountResult || {};
				return res.status(200).json({
					account_number,
					account_name,
				});
			}
			return res.status(200).json(result.body.data || result.body);
		}
	);
};

// new save receipt function
payController.saveR = async (req, res) => {
	try {
		const receipt = { ...req.body };
		let cardID = req.body.cardID;
		let amount = Number(user.availablePoints);
		let balance;

		const user = await MODEL.userModel.findOne({ cardID });
		if (!user) {
			return res.status(400).json({
				message: "Enter a valid card ID",
			});
		}

		if (Number(user.availablePoints) < 0) {
			return res.status(400).json({
				message: "Insufficent Available balance",
			});
		}

		if (Number(user.availablePoints) < 5000) {
			return res.status(400).json({
				message: "Insufficent Available balance",
			});
		}

		balance = Number(user.availablePoints) - Number(amount);

		const allTransations = await MODEL.transactionModel.find({
			paid: false,
			requestedForPayment: false,
			cardID: cardID,
		});

		await Promise.all(
			allTransations.map(async (tran) => {
				await MODEL.userModel.updateOne(
					{ _id: user._id },
					{
						availablePoints: balance,
					}
				);
				const storePaymentRequest = await MODEL.payModel.create({
					...receipt,
					aggregatorName: tran.recycler || " ",
					aggregatorId: tran.aggregatorId || " ",
					aggregatorOrganisation: tran.organisation || " ",
					scheduleId: tran.scheduleId || " ",
					quantityOfWaste: tran.weight || " ",
					amount: tran.coin,
					organisation: tran.organisation,
					organisationID: tran.organisationID,
					status: user.state,
					userPhone: user.phone,
				});
				console.log("stored payment", storePaymentRequest);

				await MODEL.transactionModel.updateOne(
					{ _id: tran._id },
					{
						$set: {
							requestedForPayment: true,
						},
					}
				);

				const organisation = await MODEL.organisationModel.findOne({
					companyName: tran.organisation,
				});

				//so help
				var phoneNo = String(organisation.phone);
				var data = {
					to: `234${phoneNo}`,
					from: "N-Alert",
					sms: `Dear ${tran.organisation}, a user named ${receipt.fullname} just requested for a payout of ${tran.coin}, kindly attend to the payment.`,
					type: "plain",
					api_key:
						"TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
					channel: "dnd",
				};

				var options = {
					method: "POST",
					url: "https://termii.com/api/sms/send",
					headers: {
						"Content-Type": ["application/json", "application/json"],
					},
					body: JSON.stringify(data),
				};

				const send = await axios.post(options.url, options.body, {
					headers: options.headers,
				});

				console.log("res", send.data);
			})
		);

		await MODEL.userModel.updateOne(
			{ _id: user._id },
			{
				availablePoints: balance,
			}
		);
		return res.status(200).json({
			error: false,
			message: "payment requested successfully",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: true,
			message: "An error occurred",
		});
	}
};

// new charity function nn
payController.charityP = async (req, res) => {
	try {
		const { cardID, amount, charityOrganisationID } = req.body;
		let balance;

		const user = await MODEL.userModel.findOne({ cardID });
		if (!user) {
			return res.status(400).json({
				message: "Enter a valid card ID",
			});
		}

		const charityOrganisation = await charityOrganisationModel.findById(
			charityOrganisationID
		);
		if (!charityOrganisation)
			return res.status(404).json({
				error: true,
				message: "Charity organisation not found!",
			});

		if (Number(user.availablePoints) < 0) {
			return res.status(400).json({
				message: "You don't have enough points to complete this transaction",
			});
		}

		if (Number(amount) > Number(user.availablePoints)) {
			return res.status(400).json({
				message: "You don't have enough points to complete this transaction",
			});
		}

		// if (Number(user.availablePoints) < 5000) {
		//   return res.status(400).json({
		//     message: "You don't have enough points to complete this transaction",
		//   });
		// }

		balance = Number(user.availablePoints) - Number(amount);

		await MODEL.userModel.updateOne(
			{ _id: user._id },
			{
				availablePoints: balance,
			}
		);

		await MODEL.charityModel.create({
			cardID,
			amount,
			state: user.state,
			user: user._id,
			charityOrganisation: charityOrganisationID,
		});

		await MODEL.transactionModel.create({
			userId: user._id,
			address: user.address,
			fullname: user.fullname,
			coin: amount,
			wastePickerCoin: 0,
			weight: 0,
			type: "charity",
			scheduleId: "",
			cardID: user._id.toString(),
			completedBy: user._id.toString(),
			paid: true,
			approval: "true",
			phone: user.phone,
			paymentResolution: "charity",
			state: "Lagos",
			ref_id: Math.floor(100000 + Math.random() * 900000),
		});

		SlackService.charityPayment({
			amount,
			user: user._id,
			charityOrganisation: charityOrganisation.name,
		});
		return res.status(200).json({
			error: false,
			message: "payment successfully made to charity",
		});
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			error: true,
			message: "An error occurred",
		});
	}
};

payController.saveReceipt = (REQUEST, RESPONSE) => {
	let errors = {};
	const receipt = { ...REQUEST.body };
	let cardID = REQUEST.body.cardID;
	let amount = REQUEST.body.amount;
	var balance;

	MODEL.userModel.findOne({ cardID: cardID }).then((result, err) => {
		if (!result)
			return RESPONSE.status(400).json({ message: "Enter a valid card ID" });
		if (result) {
			balance = result.availablePoints - amount;
			if (balance < 0) {
				return RESPONSE.status(406).json({
					message: "You don't have enough points to complete this transaction",
				});
			}
			MODEL.transactionModel
				.find({
					paid: false,
					requestedForPayment: false,
					cardID: cardID,
				})
				.then((unpaidFees) => {
					for (let i = 0; i < unpaidFees.length; i++) {
						MODEL.userModel.updateOne(
							{ cardID: cardID },
							{ availablePoints: balance },
							(err, resp) => {
								MODEL.payModel({
									...receipt,
									aggregatorName: unpaidFees[i].recycler || " ",
									aggregatorId: unpaidFees[i].aggregatorId || " ",
									aggregatorOrganisation: unpaidFees[i].organisation || " ",
									scheduleId: unpaidFees[i].scheduleId || " ",
									quantityOfWaste: unpaidFees[i].weight || " ",
									amount: unpaidFees[i].coin,
									organisationID: unpaidFees[i].organisationID,
									organisation: unpaidFees[i].organisation,
									status: result.state,
								}).save({}, (err, results) => {
									MODEL.transactionModel.updateOne(
										{ _id: unpaidFees[i]._id },
										{
											$set: {
												requestedForPayment: true,
											},
										},
										(err, res) => {
											console.log("updated here", err);
										}
									);
									MODEL.organisationModel
										.findOne({
											companyName: unpaidFees[i].organisation,
										})
										.then((organisation) => {
											var phoneNo = String(organisation.phone);
											var data = {
												to: `234${phoneNo}`,
												from: "N-Alert",
												sms: `Dear ${unpaidFees[i].organisation}, a user named ${receipt.fullname} just requested for a payout of ${unpaidFees[i].coin}, kindly attend to the payment.`,
												type: "plain",
												api_key:
													"TLTKtZ0sb5eyWLjkyV1amNul8gtgki2kyLRrotLY0Pz5y5ic1wz9wW3U9bbT63",
												channel: "dnd",
											};

											var options = {
												method: "POST",
												url: "https://termii.com/api/sms/send",
												headers: {
													"Content-Type": [
														"application/json",
														"application/json",
													],
												},
												body: JSON.stringify(data),
											};

											request(options, function (error, response) {
												if (error) throw new Error(error);
												console.log(response.body);
											});

											if (err)
												return RESPONSE.status(400).json({
													message: "Could not save receipt",
												});
										});
								});
							}
						);
					}
					return RESPONSE.status(201).json(result);
				});
		}
	});
};

payController.charityPayment = (REQUEST, RESPONSE) => {
	let errors = {};
	const receipt = { ...REQUEST.body };
	let cardID = REQUEST.body.cardID;
	let amount = REQUEST.body.amount;
	var balance;

	MODEL.userModel.findOne({ cardID: cardID }).then((result, err) => {
		if (!result)
			return RESPONSE.status(400).json({ message: "Enter a valid card ID" });
		if (result) {
			balance = result.availablePoints - amount;
			if (balance < 0) {
				return RESPONSE.status(406).json({
					message: "You don't have enough points to complete this transaction",
				});
			}
			MODEL.transactionModel
				.find({
					paid: false,
					requestedForPayment: false,
					cardID: cardID,
				})
				.then((unpaidFees) => {
					for (let i = 0; i < unpaidFees.length; i++) {
						MODEL.userModel.updateOne(
							{ cardID: cardID },
							{ availablePoints: balance },
							(err, resp) => {
								MODEL.charityModel({
									...receipt,
									aggregatorName: unpaidFees[i].recycler || " ",
									aggregatorId: unpaidFees[i].aggregatorId || " ",
									aggregatorOrganisation: unpaidFees[i].organisation || " ",
									scheduleId: unpaidFees[i].scheduleId || " ",
									quantityOfWaste: unpaidFees[i].weight || " ",
									amount: unpaidFees[i].coin,
									organisationID: unpaidFees[i].organisationID,
									organisation: unpaidFees[i].organisation,
									status: result.state,
								}).save({}, (err, result) => {
									if (err) {
										return RESPONSE.status(400).json({
											message: "Could not save receipt",
										});
									}
									console.log("Charity saved here", result);
									MODEL.transactionModel.updateOne(
										{ _id: unpaidFees[i]._id },
										{
											$set: {
												requestedForPayment: true,
												paymentResolution: "charity",
											},
										},
										(err, res) => {
											console.log("updated here", err);
										}
									);
								});
							}
						);
					}
					return RESPONSE.status(201).json(result);
				});
		}
	});
};

payController.afterPayment = async (req, res) => {
	const userID = req.query.userID;
	try {
		const user = await MODEL.userModel.findById(userID);
		if (!user) {
			return res.status(400).json({
				error: true,
				message: "Invalid userId passed",
				data: null,
			});
		}
		const token = COMMON_FUN.authToken(user);

		let ledgerBalance = await MODEL.legderBalanceModel.aggregate([
			{
				$match: {
					userId: user._id.toString(),
					paidToBalance: false,
				},
			},
			{
				$project: {
					balance: { $sum: "$pointGained" },
				},
			},
		]);
		console.log("led", ledgerBalance);
		if (ledgerBalance.length > 0) {
			ledgerBalance = ledgerBalance[0].balance;
		}
		ledgerBalance = 0;

		const test = {
			_id: user._id,
			firstname: user.firstname,
			lastname: user.lastname,
			email: user.email,
			phone: user.phone,
			fullname: user.fullname,
			gender: user.gender,
			country: user.country,
			state: user.state,
			username: user.username,
			othernames: user.othernames,
			address: user.address,
			profile_picture: user.profile_picture,
			roles: user.roles,
			countryCode: user.countryCode,
			verified: user.verified,
			availablePoints: user.availablePoints,
			rafflePoints: user.rafflePoints,
			schedulePoints: user.schedulePoints,
			onesignal_id: user.signal_id,
			cardID: user.cardID,
			lcd: user.lcd,
			last_logged_in: user.last_logged_in,
			firstLogin: user.last_logged_in ? false : true,
			terms_condition: true,
			token,
			charge: 100,
			withdrawableAmount: user.availablePoints - 100,
			requestedAmount: user.requestedAmount,
			ledgerBalance,
		};
		console.log("test", test);
		return res
			.status(200)
			.jsonp(
				COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, test)
			);
		// MODEL.userModel.findOne({ _id: userID }).then((result) => {
		//   var test = JSON.parse(JSON.stringify(result));
		//   var jwtToken = COMMON_FUN.createToken(test); /** creating jwt token */
		//   test.token = jwtToken;
		//   return res
		//     .status(200)
		//     .jsonp(
		//       COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, test)
		//     );
		// });
	} catch (err) {
		console.log(err);
		return res.status(500).json(err);
	}
};

payController.requestedPayment = (req, res) => {
	let company_id = req.query.company_id;
	try {
		payModel
			.find({ organisation: company_id })
			.sort({
				_id: -1,
			})
			.then((payments) => {
				return res.status(200).json(payments);
			});
	} catch (err) {
		return res.status(500).json(err);
	}
};

payController.allPayoutHistory = (req, res) => {
	try {
		payModel.find({}).then((payments) => {
			return res.status(200).json(payments);
		});
	} catch (err) {
		return res.status(500).json(err);
	}
};

payController.paymentUpdate = (req, res) => {
	const id = req.body.id;
	try {
		MODEL.payModel.updateOne(
			{ scheduleId: ObjectId(id) },
			{ $set: { paid: true } },
			(_e, _res) => {
				MODEL.transactionModel.updateOne(
					{ scheduleId: ObjectId(id) },
					{ $set: { paid: true } },
					(err, resp) => {
						if (err) {
							return res.status(400).jsonp(err);
						}
						return res.status(200).json({
							message: "Payment status successfully updated!",
						});
					}
				);
			}
		);
	} catch (err) {
		return res.status(500).json(err);
	}
};
/* export payController */
module.exports = payController;
