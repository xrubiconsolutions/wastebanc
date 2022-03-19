const { body } = require("express-validator");
const collectorModel = require("../models/collectorModel");

module.exports = {
  verifyCollector: [
    body("collectorId")
      .exists()
      .withMessage("provide collector id")
      .isMongoId()
      .withMessage("invalid id")
      .custom(async (val) => {
        const collector = await collectorModel.findById(val);
        if (!collector) throw new Error("collector with id not found");
        return true;
      }),
  ],
};
