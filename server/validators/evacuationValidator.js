const { body, param, query } = require("express-validator");
const statusActions = Object.freeze(["accept", "reject", "approve"]);
module.exports = {
  statusUpdate: [
    param("action")
      .notEmpty()
      .isIn(statusActions)
      .withMessage(`action param must include: ${statusActions}`),
    param("requestId")
      .notEmpty()
      .withMessage("requestId is required")
      .isMongoId()
      .withMessage("requestId id is invalid"),
  ],
};
