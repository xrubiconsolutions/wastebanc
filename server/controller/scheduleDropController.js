"use strict";

let scheduleDropController = {};
let MODEL = require("../models");
let COMMON_FUN = require("../util/commonFunction");
let CONSTANTS = require("../util/constants");

scheduleDropController.schedule = (REQUEST, RESPONSE) => {
  var data = { ...REQUEST.body };

  MODEL.userModel.findOne({ email: REQUEST.body.client }).then((result) => {
    MODEL.userModel.updateOne(
      { email: REQUEST.body.scheduleCreator },
      { last_logged_in: new Date() },
      (res) => {
        console.log("Logged date updated", new Date());
      }
    );

    MODEL.scheduleDropModel(data).save({}, (ERR, RESULT) => {
      try {
        if (ERR) return RESPONSE.status(400).jsonp(COMMON_FUN.sendError(ERR));

        return RESPONSE.status(200).json(
          COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, RESULT)
        );
      } catch (err) {
        return RESPONSE.status(400).json(err);
      }
    });
  });
};

scheduleDropController.getPendingSchedule = (REQUEST, RESPONSE) => {
  MODEL.scheduleDropModel
    .find({
      completionStatus: "pending",
    })
    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.getCompletedSchedule = (REQUEST, RESPONSE) => {
  MODEL.scheduleDropModel
    .find({
      completionStatus: "completed",
    })
    .then((schedules) => {
      return RESPONSE.json(
        COMMON_FUN.sendSuccess(CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, schedules)
      );
    })
    .catch((err) => RESPONSE.status(400).jsonp(COMMON_FUN.sendError(err)));
};

scheduleDropController.rewardDropSystem = (REQUEST, RESPONSE) => {
  const collectorID = REQUEST.body.collectorID;
  const quantity = REQUEST.body.quantity;
  if (!quantity)
    return RESPONSE.status(400).json({
      message: "Enter a valid input for the quantity",
    });

  try {
    MODEL.scheduleDropModel.find({ _id: REQUEST.body._id }).then((schedule) => {
      if (!schedule[0])
        return RESPONSE.status(400).json({
          message: "This schedule is invalid",
        });
      MODEL.userModel.findOne({ email: schedule[0].client }).then((result) => {
        if (result.cardID == null)
          return RESPONSE.status(400).jsonp({
            message: "you don't have a valid card ID",
          });
        MODEL.transactionModel
          .findOne({ scheduleId: REQUEST.body._id })
          .then((transaction) => {
            if (transaction) {
              return RESPONSE.status(400).jsonp({
                message:
                  "This transaction had been completed by another recycler",
              });
            } else {
              //100g is equivalent to 1 coin i.e 1kg is equivalent to 10 coins
              // quantity in g

              // var equivalent = (quantity / 1000) * 10;
              MODEL.collectorModel
                .findOne({ _id: collectorID })
                .then((recycler, err) => {
                  MODEL.organisationModel
                    .findOne({
                      _id: recycler.approvedBy,
                    })
                    .then((organisation) => {
                      var category =
                        schedule[0].Category === "nylonSachet"
                          ? "nylon"
                          : schedule[0].Category === "glassBottle"
                          ? "glass"
                          : schedule[0].Category.length < 4
                          ? schedule[0].Category.substring(
                              0,
                              schedule[0].Category.length
                            )
                          : schedule[0].Category.substring(
                              0,
                              schedule[0].Category.length - 1
                            );

                      var organisationCheck = JSON.parse(
                        JSON.stringify(organisation)
                      );
                      for (let val in organisationCheck) {
                        if (val.includes(category)) {
                          const equivalent = !!organisationCheck[val]
                            ? organisationCheck[val]
                            : 1;
                          const pricing = quantity * equivalent;
                          MODEL.collectorModel.updateOne(
                            { email: recycler.email },
                            { last_logged_in: new Date() },
                            (res) => {
                              console.log("Logged date updated", new Date());
                            }
                          );
                          var dataToSave = {
                            weight: quantity,

                            coin: pricing,

                            cardID: result._id,

                            scheduleId: schedule[0]._id,

                            completedBy: collectorID,

                            Category: schedule[0].Category,

                            fullname: result.firstname + " " + result.lastname,

                            recycler: recycler.fullname,

                            aggregatorId: recycler.aggregatorId || " ",

                            organisation: recycler.organisation,

                            organisationID: recycler.approvedBy,
                          };
                          MODEL.transactionModel(dataToSave).save(
                            {},
                            (ERR, RESULT) => {
                              var message = {
                                app_id: "8d939dc2-59c5-4458-8106-1e6f6fbe392d",
                                contents: {
                                  en: "Your schedule drop off has been completed successfully. You have received the equivalent amount in your wallet",
                                },
                                include_player_ids: [`${result.onesignal_id}`],
                              };

                              sendNotification(message);

                              // if (ERR)
                              //   return RESPONSE.status(400).jsonp(ERR);
                              MODEL.scheduleDropModel.updateOne(
                                { _id: schedule[0]._id },
                                {
                                  $set: {
                                    completionStatus: "completed",
                                    collectedBy: collectorID,
                                    quantity: quantity,
                                  },
                                },
                                (err, res) => {
                                  if (err)
                                    return RESPONSE.status(400).json(err);
                                  MODEL.userModel.updateOne(
                                    { email: result.email },
                                    {
                                      $set: {
                                        availablePoints:
                                          result.availablePoints + pricing,
                                        schedulePoints:
                                          result.schedulePoints + 1,
                                      },
                                    },
                                    (err, res) => {
                                      console.log("update user", err, res);
                                    }
                                  );
                                  MODEL.collectorModel.updateOne(
                                    { _id: collectorID },
                                    {
                                      $set: {
                                        totalCollected:
                                          recycler.totalCollected +
                                          Number(quantity),
                                        numberOfTripsCompleted:
                                          recycler.numberOfTripsCompleted + 1,
                                        busy: false,
                                      },
                                    },
                                    (err, res) => {
                                      console.log("update", err, res);
                                    }
                                  );
                                  return RESPONSE.status(200).json({
                                    message:
                                      "Transaction Completed Successfully",
                                  });
                                }
                              );
                            }
                          );
                          break;
                        }
                      }
                    });
                });
            }
          });
      });
    });
  } catch (err) {
    return RESPONSE.status(500).json(err);
  }
};

scheduleDropController.dropRequestRecycler = (req, res) => {
  const organisationId = req.query.organisationId;
  try {
    MODEL.scheduleDropModel
      .find({
        organisationCollection: organisationId,
      })
      .then((drop) => {
        return res.status(200).json(drop);
      });
  } catch (err) {
    return res.status(500).json(err);
  }
};

module.exports = scheduleDropController;
