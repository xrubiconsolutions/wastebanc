const {
  collectorModel,
  collectorBinModel,
  wastebancAgentModel,
  evacuationModel,
  transactionModel,
} = require("../models");

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
}

module.exports = EvacuationService;
